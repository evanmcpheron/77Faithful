import {
	FieldPath,
	getFirestore,
	Timestamp,
	type Firestore,
} from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import {
	CommunityPostLimits,
	parseListOwnCommunityContributionsRequest,
} from '../../generated/features/communities/community-post';
import type {
	IListOwnCommunityContributionsResult,
	IOwnCommunityContribution,
} from '../../generated/types/community/community-post-function.types';
import {
	isIdentifier,
	postError,
	requirePostAccount,
	requireRevision,
	requireTimestamp,
} from './community-post';

interface ICursor {
	version: 1;
	kind: 'OwnContributions';
	userId: string;
	seconds: number;
	nanoseconds: number;
	recordId: string;
}

const decodeCursor = (value: string, userId: string): ICursor => {
	try {
		const decoded: unknown = JSON.parse(
			Buffer.from(value, 'base64url').toString('utf8'),
		);
		if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded))
			throw Error();
		const cursor = decoded as Record<string, unknown>;
		if (
			Object.keys(cursor).length !== 6 ||
			cursor['version'] !== 1 ||
			cursor['kind'] !== 'OwnContributions' ||
			cursor['userId'] !== userId ||
			!Number.isSafeInteger(cursor['seconds']) ||
			!Number.isInteger(cursor['nanoseconds']) ||
			typeof cursor['nanoseconds'] !== 'number' ||
			cursor['nanoseconds'] < 0 ||
			cursor['nanoseconds'] >= 1_000_000_000 ||
			!isIdentifier(cursor['recordId'])
		)
			throw Error();
		return cursor as unknown as ICursor;
	} catch {
		throw postError(
			'invalid-argument',
			'This contribution page is unavailable.',
			'InvalidCursor',
		);
	}
};

export const listOwnCommunityContributionsForAccount = async (
	userId: string,
	value: unknown,
	database: Firestore = getFirestore(),
): Promise<IListOwnCommunityContributionsResult> => {
	let input;
	try {
		input = parseListOwnCommunityContributionsRequest(value);
	} catch {
		const candidate =
			value && typeof value === 'object' && !Array.isArray(value)
				? (value as Record<string, unknown>)['cursor']
				: undefined;
		if (
			candidate !== undefined &&
			(typeof candidate !== 'string' ||
				candidate.length < 1 ||
				candidate.length > CommunityPostLimits.cursor ||
				!/^[a-zA-Z0-9_-]+$/.test(candidate))
		)
			throw postError(
				'invalid-argument',
				'This contribution page is unavailable.',
				'InvalidCursor',
			);
		throw postError(
			'invalid-argument',
			'Choose a valid contribution page.',
			'InvalidInput',
		);
	}
	if (!(await database.doc(`users/${userId}`).get()).exists)
		throw postError(
			'failed-precondition',
			'Your account is unavailable.',
			'AccountUnavailable',
		);
	let query = database
		.collection(`users/${userId}/communityPostContributions`)
		.orderBy('createdAt', 'desc')
		.orderBy(FieldPath.documentId(), 'desc');
	if (input.cursor) {
		const cursor = decodeCursor(input.cursor, userId);
		query = query.startAfter(
			new Timestamp(cursor.seconds, cursor.nanoseconds),
			cursor.recordId,
		);
	}
	const snapshots = await query
		.limit((input.pageSize ?? CommunityPostLimits.defaultPageSize) + 1)
		.get();
	const page = snapshots.docs.slice(0, input.pageSize);
	const contributions: IOwnCommunityContribution[] = [];
	for (const index of page) {
		const data = index.data();
		if (
			data.schemaVersion !== 1 ||
			data.userId !== userId ||
			!isIdentifier(data.communityId) ||
			!isIdentifier(data.postId) ||
			(data.replyId !== undefined && !isIdentifier(data.replyId)) ||
			!(data.createdAt instanceof Timestamp)
		)
			continue;
		const community = await database
			.doc(`communities/${data.communityId}`)
			.get();
		if (
			!community.exists ||
			(community.get('lifecycle.status') !== 'Active' &&
				community.get('lifecycle.status') !== 'Closed')
		)
			continue;
		const post = await database
			.doc(`communities/${data.communityId}/posts/${data.postId}`)
			.get();
		if (!post.exists || post.get('communityId') !== data.communityId)
			continue;
		const record =
			data.replyId === undefined
				? post
				: await post.ref.collection('replies').doc(data.replyId).get();
		if (
			!record.exists ||
			record.get('communityId') !== data.communityId ||
			record.get('author.userId') !== userId ||
			(data.replyId !== undefined && record.get('postId') !== data.postId)
		)
			continue;
		const publication = record.get('publication');
		if (
			!publication ||
			!['Published', 'AuthorDeleted', 'ModeratorRemoved'].includes(
				publication.status,
			)
		)
			continue;
		const revision = requireRevision(record.get('revision'));
		const createdAt = requireTimestamp(record.get('createdAt'));
		let text: string | undefined;
		if (publication.status === 'Published') {
			text =
				data.replyId === undefined
					? publication.content?.text
					: publication.text;
			if (
				typeof text !== 'string' ||
				text.length < 1 ||
				text.length > CommunityPostLimits.text
			)
				continue;
		}
		contributions.push({
			communityId: data.communityId,
			postId: data.postId,
			...(data.replyId === undefined ? {} : { replyId: data.replyId }),
			kind: data.replyId === undefined ? 'Post' : 'Reply',
			publicationStatus: publication.status,
			revision,
			createdAt: {
				seconds: createdAt.seconds,
				nanoseconds: createdAt.nanoseconds,
			},
			...(text === undefined ? {} : { text }),
		});
	}
	const last = page[page.length - 1];
	const nextCursor =
		snapshots.docs.length > page.length && last
			? Buffer.from(
					JSON.stringify({
						version: 1,
						kind: 'OwnContributions',
						userId,
						seconds: last.get('createdAt').seconds,
						nanoseconds: last.get('createdAt').nanoseconds,
						recordId: last.id,
					}),
				).toString('base64url')
			: null;
	return { contributions, nextCursor };
};

export const listOwnCommunityContributions = onCall(async (request) =>
	listOwnCommunityContributionsForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);
