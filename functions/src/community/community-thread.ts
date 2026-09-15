import {
	FieldPath,
	getFirestore,
	Timestamp,
	type DocumentData,
	type DocumentSnapshot,
	type Firestore,
	type Query,
	type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
	CommunityPostLimits,
	parseCreateCommunityReplyRequest,
	parseDeleteCommunityReplyRequest,
	parseEditCommunityReplyRequest,
	parseListCommunityPrayerSupportRequest,
	parseListCommunityRepliesRequest,
	parseSetCommunityPrayerAcknowledgmentRequest,
	parseSetCommunityPrayerRequestStatusRequest,
} from '../../generated/features/communities/community-post';
import type {
	ICreateCommunityReplyRequest,
	ICreateCommunityReplyResult,
	IDeleteCommunityReplyRequest,
	IDeleteCommunityReplyResult,
	IEditCommunityReplyRequest,
	IEditCommunityReplyResult,
	IListCommunityPrayerSupportRequest,
	IListCommunityPrayerSupportResult,
	IListCommunityRepliesRequest,
	IListCommunityRepliesResult,
	ISetCommunityPrayerAcknowledgmentRequest,
	ISetCommunityPrayerAcknowledgmentResult,
	ISetCommunityPrayerRequestStatusRequest,
	ISetCommunityPrayerRequestStatusResult,
} from '../../generated/types/community/community-post-function.types';
import type {
	ICommunityPost,
	ICommunityPrayerRequestContent,
	ICommunityPrayerSupporter,
	ICommunityReply,
	ICommunityReplyDocument,
} from '../../generated/types/community/community-post.types';
import type { IPersistedTimestamp } from '../../generated/types/shared/persistence.types';
import { redactDeletedAuthors } from './community-cleanup';
import { createNotificationEvent } from './community-notification-event';
import {
	dataUnavailable,
	getCommunityAccess,
	isIdentifier,
	parseInput,
	postError,
	postProjection,
	requireAccountAndCommunity,
	requireActiveCommunity,
	requirePostAccount,
	requireRevision,
	requireTimestamp,
	type ICommunityPostDependencies,
} from './community-post';
import {
	consumeSubmissionBudget,
	isBlockedRelationship,
	requireSafeSubmission,
	requireUnblockedInteraction,
	visibleToViewer,
} from './community-safety';

interface IThreadCursor {
	version: 1;
	kind: 'CommunityReplies' | 'CommunityPrayerSupport';
	communityId: string;
	postId: string;
	seconds: number;
	nanoseconds: number;
	recordId: string;
}

type TThreadMutationRequest =
	| ICreateCommunityReplyRequest
	| IEditCommunityReplyRequest
	| IDeleteCommunityReplyRequest
	| ISetCommunityPrayerRequestStatusRequest
	| ISetCommunityPrayerAcknowledgmentRequest;

const nextRevision = (revision: number): number => {
	if (revision >= CommunityPostLimits.maxRevision) throw dataUnavailable();
	return revision + 1;
};

const serializeTimestamp = (timestamp: Timestamp): IPersistedTimestamp => ({
	seconds: timestamp.seconds,
	nanoseconds: timestamp.nanoseconds,
});

const requestDigest = (input: TThreadMutationRequest): string => {
	const request = { ...input } as Record<string, unknown>;
	delete request['operationId'];
	return createHash('sha256')
		.update(JSON.stringify(request), 'utf8')
		.digest('hex');
};

const operationReference = (
	database: Firestore,
	userId: string,
	kind:
		| 'ReplyCreate'
		| 'ReplyEdit'
		| 'ReplyDelete'
		| 'PrayerStatus'
		| 'PrayerAcknowledgment',
	operationId: string,
) => database.doc(`users/${userId}/community${kind}Operations/${operationId}`);

const contributionReference = (
	database: Firestore,
	userId: string,
	communityId: string,
	postId: string,
	replyId: string,
) =>
	database.doc(
		`users/${userId}/communityPostContributions/${createHash('sha256')
			.update(`${communityId}\u0000${postId}\u0000${replyId}`, 'utf8')
			.digest('hex')}`,
	);

const acknowledgmentReference = (
	database: Firestore,
	communityId: string,
	postId: string,
	userId: string,
) =>
	database.doc(
		`communities/${communityId}/posts/${postId}/prayerAcknowledgments/${userId}`,
	);

const assertReceipt = (
	receipt: DocumentSnapshot,
	input: TThreadMutationRequest,
): DocumentData | null => {
	if (!receipt.exists) return null;
	const data = receipt.data();
	if (!data || data.requestDigest !== requestDigest(input))
		throw postError(
			'already-exists',
			'This operation ID was already used for different thread details.',
			'OperationPayloadMismatch',
		);
	return data;
};

const requireParentPost = (
	snapshot: DocumentSnapshot,
	communityId: string,
	postId: string,
): ICommunityPost => {
	if (!snapshot.exists || snapshot.id !== postId)
		throw postError(
			'not-found',
			'This post is unavailable.',
			'PostUnavailable',
		);
	return postProjection(snapshot, communityId);
};

const requirePublishedParent = (post: ICommunityPost): void => {
	if (post.publication.status !== 'Published')
		throw postError(
			'failed-precondition',
			'This thread is no longer accepting replies.',
			'PostUnavailable',
		);
};

const replyProjection = (
	snapshot: DocumentSnapshot,
	communityId: string,
	postId: string,
): ICommunityReply => {
	const reply = snapshot.data();
	if (
		!reply ||
		reply.schemaVersion !== 1 ||
		reply.communityId !== communityId ||
		reply.postId !== postId ||
		!reply.author ||
		!isIdentifier(reply.author.userId) ||
		typeof reply.author.displayName !== 'string' ||
		reply.author.displayName.length > 80 ||
		!reply.publication ||
		typeof reply.publication !== 'object'
	)
		throw dataUnavailable();
	const createdAt = requireTimestamp(reply.createdAt);
	const updatedAt = requireTimestamp(reply.updatedAt);
	const editedAt =
		reply.editedAt === null ? null : requireTimestamp(reply.editedAt);
	const revision = requireRevision(reply.revision);
	const publication = reply.publication as Record<string, unknown>;
	if (publication['status'] === 'Published') {
		if (
			Object.keys(publication).length !== 2 ||
			typeof publication['text'] !== 'string' ||
			publication['text'].length < 1 ||
			publication['text'].length > CommunityPostLimits.text
		)
			throw dataUnavailable();
		return {
			replyId: snapshot.id,
			schemaVersion: 1,
			communityId,
			postId,
			author: {
				userId: reply.author.userId,
				displayName: reply.author.displayName,
			},
			revision,
			editedAt: editedAt === null ? null : serializeTimestamp(editedAt),
			publication: { status: 'Published', text: publication['text'] },
			createdAt: serializeTimestamp(createdAt),
			updatedAt: serializeTimestamp(updatedAt),
		};
	}
	if (
		publication['status'] !== 'AuthorDeleted' &&
		publication['status'] !== 'ModeratorRemoved'
	)
		throw dataUnavailable();
	const status = publication['status'];
	const timestampKey = status === 'AuthorDeleted' ? 'deletedAt' : 'removedAt';
	if (Object.keys(publication).length !== 2) throw dataUnavailable();
	const removedAt = requireTimestamp(publication[timestampKey]);
	return {
		replyId: snapshot.id,
		schemaVersion: 1,
		communityId,
		postId,
		author: {
			userId: reply.author.userId,
			displayName: reply.author.displayName,
		},
		revision,
		editedAt: editedAt === null ? null : serializeTimestamp(editedAt),
		publication:
			status === 'AuthorDeleted'
				? { status, deletedAt: serializeTimestamp(removedAt) }
				: { status, removedAt: serializeTimestamp(removedAt) },
		createdAt: serializeTimestamp(createdAt),
		updatedAt: serializeTimestamp(updatedAt),
	};
};

const requireReplyAuthor = (
	reply: ICommunityReply,
	userId: string,
): Extract<ICommunityReply['publication'], { status: 'Published' }> => {
	if (reply.author.userId !== userId)
		throw postError(
			'permission-denied',
			'Only the reply author can change these words.',
			'ReplyAuthorRequired',
		);
	if (reply.publication.status !== 'Published')
		throw postError(
			'failed-precondition',
			'This reply is no longer available to change.',
			'ReplyUnavailable',
		);
	return reply.publication;
};

const requireExpectedReplyRevision = (
	reply: ICommunityReply,
	expectedRevision: number,
): void => {
	if (reply.revision !== expectedRevision)
		throw postError(
			'aborted',
			'This reply changed. Review it and try again.',
			'RevisionConflict',
		);
};

const encodeCursor = (
	kind: IThreadCursor['kind'],
	communityId: string,
	postId: string,
	timestamp: Timestamp,
	recordId: string,
): string =>
	Buffer.from(
		JSON.stringify({
			version: 1,
			kind,
			communityId,
			postId,
			seconds: timestamp.seconds,
			nanoseconds: timestamp.nanoseconds,
			recordId,
		} satisfies IThreadCursor),
	).toString('base64url');

const decodeCursor = (
	value: string,
	kind: IThreadCursor['kind'],
	communityId: string,
	postId: string,
): IThreadCursor => {
	try {
		const decoded: unknown = JSON.parse(
			Buffer.from(value, 'base64url').toString('utf8'),
		);
		if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded))
			throw new Error('Invalid cursor record.');
		const cursor = decoded as Record<string, unknown>;
		if (
			Object.keys(cursor).length !== 7 ||
			cursor['version'] !== 1 ||
			cursor['kind'] !== kind ||
			cursor['communityId'] !== communityId ||
			cursor['postId'] !== postId ||
			typeof cursor['seconds'] !== 'number' ||
			!Number.isSafeInteger(cursor['seconds']) ||
			typeof cursor['nanoseconds'] !== 'number' ||
			!Number.isInteger(cursor['nanoseconds']) ||
			cursor['nanoseconds'] < 0 ||
			cursor['nanoseconds'] > 999_999_999 ||
			!isIdentifier(cursor['recordId'])
		)
			throw new Error('Invalid cursor values.');
		return cursor as unknown as IThreadCursor;
	} catch {
		throw postError(
			'invalid-argument',
			'This thread position is unavailable. Start again.',
			'InvalidCursor',
		);
	}
};

export const createCommunityReplyForAccount = async (
	userId: string,
	value: unknown,
	dependencies: ICommunityPostDependencies = {},
): Promise<ICreateCommunityReplyResult> => {
	const input = parseInput(parseCreateCommunityReplyRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const postReference = database.doc(
		`communities/${input.communityId}/posts/${input.postId}`,
	);
	const replyReference = postReference.collection('replies').doc();
	const receiptReference = operationReference(
		database,
		userId,
		'ReplyCreate',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const access = await getCommunityAccess(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireActiveCommunity(access.community);
		const [postSnapshot, receipt] = await Promise.all([
			transaction.get(postReference),
			transaction.get(receiptReference),
		]);
		const post = requireParentPost(
			postSnapshot,
			input.communityId,
			input.postId,
		);
		requirePublishedParent(post);
		await requireUnblockedInteraction(
			transaction,
			database,
			userId,
			post.author.userId,
		);
		const previous = assertReceipt(receipt, input);
		if (previous) {
			if (
				previous.postId !== input.postId ||
				!isIdentifier(previous.replyId) ||
				previous.revision !== 0 ||
				!(previous.createdAt instanceof Timestamp)
			)
				throw dataUnavailable();
			return {
				postId: input.postId,
				replyId: previous.replyId,
				revision: 0,
				createdAt: serializeTimestamp(previous.createdAt),
			};
		}
		requireSafeSubmission(input.text);
		await consumeSubmissionBudget(transaction, database, userId, now);
		const reply: ICommunityReplyDocument = {
			schemaVersion: 1,
			communityId: input.communityId,
			postId: input.postId,
			author: { userId, displayName: access.displayName },
			revision: 0,
			editedAt: null,
			publication: { status: 'Published', text: input.text },
			createdAt: now,
			updatedAt: now,
		};
		const storedReplyCount = postSnapshot.get('replyCount');
		const replyCount =
			storedReplyCount === undefined
				? 0
				: requireRevision(storedReplyCount);
		if (replyCount >= CommunityPostLimits.maxRevision)
			throw dataUnavailable();
		transaction.create(replyReference, reply);
		createNotificationEvent(transaction, database, {
			category: 'Reply',
			communityId: input.communityId,
			postId: input.postId,
			replyId: replyReference.id,
			actorUserId: userId,
			sourceId: replyReference.id,
			now,
		});
		transaction.update(postReference, { replyCount: replyCount + 1 });
		transaction.create(
			contributionReference(
				database,
				userId,
				input.communityId,
				input.postId,
				replyReference.id,
			),
			{
				schemaVersion: 1,
				userId,
				communityId: input.communityId,
				postId: input.postId,
				replyId: replyReference.id,
				contributionKind: 'Reply',
				publicationStatus: 'Published',
				createdAt: now,
				updatedAt: now,
			},
		);
		transaction.create(receiptReference, {
			requestDigest: requestDigest(input),
			postId: input.postId,
			replyId: replyReference.id,
			revision: 0,
			createdAt: now,
		});
		return {
			postId: input.postId,
			replyId: replyReference.id,
			revision: 0,
			createdAt: serializeTimestamp(now),
		};
	});
};

export const listCommunityRepliesForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<IListCommunityRepliesResult> => {
	const input = parseListInput(parseListCommunityRepliesRequest, value);
	return database.runTransaction(async (transaction) => {
		await getCommunityAccess(
			transaction,
			database,
			userId,
			input.communityId,
		);
		const postReference = database.doc(
			`communities/${input.communityId}/posts/${input.postId}`,
		);
		const postSnapshot = await transaction.get(postReference);
		const parent = requireParentPost(
			postSnapshot,
			input.communityId,
			input.postId,
		);
		if (
			parent.publication.status === 'Published' &&
			(await isBlockedRelationship(
				transaction,
				database,
				userId,
				parent.author.userId,
			))
		)
			throw postError(
				'not-found',
				'This post is unavailable.',
				'PostUnavailable',
			);
		let query: Query = postReference
			.collection('replies')
			.orderBy('createdAt', 'asc')
			.orderBy(FieldPath.documentId(), 'asc');
		if (input.cursor) {
			const cursor = decodeCursor(
				input.cursor,
				'CommunityReplies',
				input.communityId,
				input.postId,
			);
			query = query.startAfter(
				new Timestamp(cursor.seconds, cursor.nanoseconds),
				cursor.recordId,
			);
		}
		const pageSize = input.pageSize ?? CommunityPostLimits.defaultPageSize;
		const scanBudget = Math.min(200, Math.max(pageSize + 1, pageSize * 4));
		const snapshots = await transaction.get(query.limit(scanBudget + 1));
		const scanned = snapshots.docs.slice(0, scanBudget);
		const projected = await redactDeletedAuthors(
			transaction,
			database,
			scanned.map((snapshot) =>
				replyProjection(snapshot, input.communityId, input.postId),
			),
		);
		const visibleReplies = await visibleToViewer(
			transaction,
			database,
			userId,
			projected,
		);
		const replies = visibleReplies.slice(0, pageSize);
		const consumed =
			replies.length === pageSize
				? projected.findIndex(
						(reply) =>
							reply.replyId ===
							replies[replies.length - 1].replyId,
					) + 1
				: scanned.length;
		const lastScanned = scanned[consumed - 1];
		return {
			replies,
			replyCount:
				!input.cursor && snapshots.size <= scanBudget
					? visibleReplies.length
					: replies.length,
			nextCursor:
				snapshots.size > consumed && lastScanned
					? encodeReplyCursor(input, lastScanned)
					: null,
		};
	});
};

const parseListInput = <T extends IListCommunityRepliesRequest>(
	parser: (value: unknown) => T,
	value: unknown,
): T => {
	try {
		return parser(value);
	} catch {
		const candidate =
			value && typeof value === 'object' && !Array.isArray(value)
				? (value as Record<string, unknown>)['cursor']
				: undefined;
		if (candidate !== undefined)
			throw postError(
				'invalid-argument',
				'This thread position is unavailable. Start again.',
				'InvalidCursor',
			);
		throw postError(
			'invalid-argument',
			'Choose valid community thread details.',
			'InvalidInput',
		);
	}
};

const encodeReplyCursor = (
	input: IListCommunityRepliesRequest,
	snapshot: QueryDocumentSnapshot,
): string =>
	encodeCursor(
		'CommunityReplies',
		input.communityId,
		input.postId,
		requireTimestamp(snapshot.get('createdAt')),
		snapshot.id,
	);

export const editCommunityReplyForAccount = async (
	userId: string,
	value: unknown,
	dependencies: ICommunityPostDependencies = {},
): Promise<IEditCommunityReplyResult> => {
	const input = parseInput(parseEditCommunityReplyRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const postReference = database.doc(
		`communities/${input.communityId}/posts/${input.postId}`,
	);
	const replyReference = postReference
		.collection('replies')
		.doc(input.replyId);
	const receiptReference = operationReference(
		database,
		userId,
		'ReplyEdit',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const access = await getCommunityAccess(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireActiveCommunity(access.community);
		const [postSnapshot, replySnapshot, receipt] = await Promise.all([
			transaction.get(postReference),
			transaction.get(replyReference),
			transaction.get(receiptReference),
		]);
		requireParentPost(postSnapshot, input.communityId, input.postId);
		if (!replySnapshot.exists)
			throw postError(
				'not-found',
				'This reply is unavailable.',
				'ReplyUnavailable',
			);
		const reply = replyProjection(
			replySnapshot,
			input.communityId,
			input.postId,
		);
		requireReplyAuthor(reply, userId);
		const previous = assertReceipt(receipt, input);
		if (previous) {
			if (
				previous.replyId !== input.replyId ||
				typeof previous.revision !== 'number' ||
				!(previous.editedAt instanceof Timestamp)
			)
				throw dataUnavailable();
			return {
				replyId: input.replyId,
				revision: previous.revision,
				editedAt: serializeTimestamp(previous.editedAt),
			};
		}
		requireSafeSubmission(input.text);
		await consumeSubmissionBudget(transaction, database, userId, now);
		requireExpectedReplyRevision(reply, input.expectedRevision);
		const revision = nextRevision(reply.revision);
		transaction.update(replyReference, {
			publication: { status: 'Published', text: input.text },
			revision,
			editedAt: now,
			updatedAt: now,
		});
		transaction.set(
			contributionReference(
				database,
				userId,
				input.communityId,
				input.postId,
				input.replyId,
			),
			{ updatedAt: now },
			{ merge: true },
		);
		transaction.create(receiptReference, {
			requestDigest: requestDigest(input),
			replyId: input.replyId,
			revision,
			editedAt: now,
			completedAt: now,
		});
		return {
			replyId: input.replyId,
			revision,
			editedAt: serializeTimestamp(now),
		};
	});
};

export const deleteCommunityReplyForAccount = async (
	userId: string,
	value: unknown,
	dependencies: ICommunityPostDependencies = {},
): Promise<IDeleteCommunityReplyResult> => {
	const input = parseInput(parseDeleteCommunityReplyRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const postReference = database.doc(
		`communities/${input.communityId}/posts/${input.postId}`,
	);
	const replyReference = postReference
		.collection('replies')
		.doc(input.replyId);
	const receiptReference = operationReference(
		database,
		userId,
		'ReplyDelete',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		await requireAccountAndCommunity(
			transaction,
			database,
			userId,
			input.communityId,
		);
		const [postSnapshot, replySnapshot, receipt] = await Promise.all([
			transaction.get(postReference),
			transaction.get(replyReference),
			transaction.get(receiptReference),
		]);
		requireParentPost(postSnapshot, input.communityId, input.postId);
		if (!replySnapshot.exists)
			throw postError(
				'not-found',
				'This reply is unavailable.',
				'ReplyUnavailable',
			);
		const reply = replyProjection(
			replySnapshot,
			input.communityId,
			input.postId,
		);
		if (reply.author.userId !== userId)
			throw postError(
				'permission-denied',
				'Only the reply author can delete these words.',
				'ReplyAuthorRequired',
			);
		const previous = assertReceipt(receipt, input);
		if (previous) {
			if (
				reply.publication.status !== 'AuthorDeleted' ||
				previous.replyId !== input.replyId ||
				!(previous.deletedAt instanceof Timestamp)
			)
				throw dataUnavailable();
			return {
				replyId: input.replyId,
				deletedAt: serializeTimestamp(previous.deletedAt),
			};
		}
		requireReplyAuthor(reply, userId);
		requireExpectedReplyRevision(reply, input.expectedRevision);
		transaction.update(replyReference, {
			publication: { status: 'AuthorDeleted', deletedAt: now },
			revision: nextRevision(reply.revision),
			updatedAt: now,
		});
		transaction.set(
			contributionReference(
				database,
				userId,
				input.communityId,
				input.postId,
				input.replyId,
			),
			{
				publicationStatus: 'AuthorDeleted',
				deletedAt: now,
				updatedAt: now,
			},
			{ merge: true },
		);
		transaction.create(receiptReference, {
			requestDigest: requestDigest(input),
			replyId: input.replyId,
			deletedAt: now,
			completedAt: now,
		});
		return {
			replyId: input.replyId,
			deletedAt: serializeTimestamp(now),
		};
	});
};

const requirePrayerRequest = (
	post: ICommunityPost,
): Extract<ICommunityPost['publication'], { status: 'Published' }> & {
	content: ICommunityPrayerRequestContent;
} => {
	if (
		post.publication.status !== 'Published' ||
		post.publication.content.postType !== 'PrayerRequest'
	)
		throw postError(
			'failed-precondition',
			'This prayer request is unavailable.',
			'PrayerRequestRequired',
		);
	return post.publication as Extract<
		ICommunityPost['publication'],
		{ status: 'Published' }
	> & { content: ICommunityPrayerRequestContent };
};

const isPrayerThread = (post: ICommunityPost): boolean =>
	post.publication.status === 'Published'
		? post.publication.content.postType === 'PrayerRequest'
		: post.publication.postType === 'PrayerRequest';

export const setCommunityPrayerRequestStatusForAccount = async (
	userId: string,
	value: unknown,
	dependencies: ICommunityPostDependencies = {},
): Promise<ISetCommunityPrayerRequestStatusResult> => {
	const input = parseInput(
		parseSetCommunityPrayerRequestStatusRequest,
		value,
	);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const postReference = database.doc(
		`communities/${input.communityId}/posts/${input.postId}`,
	);
	const receiptReference = operationReference(
		database,
		userId,
		'PrayerStatus',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const access = await getCommunityAccess(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireActiveCommunity(access.community);
		const [postSnapshot, receipt] = await Promise.all([
			transaction.get(postReference),
			transaction.get(receiptReference),
		]);
		const post = requireParentPost(
			postSnapshot,
			input.communityId,
			input.postId,
		);
		if (post.author.userId !== userId)
			throw postError(
				'permission-denied',
				'Only the prayer request author can change its status.',
				'PostAuthorRequired',
			);
		const publication = requirePrayerRequest(post);
		const previous = assertReceipt(receipt, input);
		if (previous) {
			if (
				previous.postId !== input.postId ||
				!['Current', 'NoLongerCurrent', 'Answered'].includes(
					previous.prayerRequestStatus,
				) ||
				typeof previous.revision !== 'number'
			)
				throw dataUnavailable();
			return {
				postId: input.postId,
				prayerRequestStatus: previous.prayerRequestStatus,
				revision: previous.revision,
			};
		}
		if (post.revision !== input.expectedRevision)
			throw postError(
				'aborted',
				'This prayer request changed. Review it and try again.',
				'RevisionConflict',
			);
		const revision =
			publication.content.prayerRequestStatus ===
			input.prayerRequestStatus
				? post.revision
				: nextRevision(post.revision);
		if (revision !== post.revision)
			transaction.update(postReference, {
				publication: {
					status: 'Published',
					content: {
						...publication.content,
						prayerRequestStatus: input.prayerRequestStatus,
					},
				},
				revision,
				updatedAt: now,
			});
		transaction.create(receiptReference, {
			requestDigest: requestDigest(input),
			postId: input.postId,
			prayerRequestStatus: input.prayerRequestStatus,
			revision,
			completedAt: now,
		});
		return {
			postId: input.postId,
			prayerRequestStatus: input.prayerRequestStatus,
			revision,
		};
	});
};

const acknowledgmentProjection = (
	snapshot: DocumentSnapshot,
	communityId: string,
	postId: string,
): {
	isPraying: boolean;
	revision: number;
	acknowledgedAt: Timestamp | null;
	firstNotificationEligibleAt: Timestamp;
	supporter: { userId: string; displayName: string };
} => {
	const acknowledgment = snapshot.data();
	if (
		!acknowledgment ||
		acknowledgment.schemaVersion !== 1 ||
		acknowledgment.communityId !== communityId ||
		acknowledgment.postId !== postId ||
		!acknowledgment.supporter ||
		acknowledgment.supporter.userId !== snapshot.id ||
		!isIdentifier(acknowledgment.supporter.userId) ||
		typeof acknowledgment.supporter.displayName !== 'string' ||
		acknowledgment.supporter.displayName.length > 80 ||
		typeof acknowledgment.isPraying !== 'boolean'
	)
		throw dataUnavailable();
	const acknowledgedAt =
		acknowledgment.acknowledgedAt === null
			? null
			: requireTimestamp(acknowledgment.acknowledgedAt);
	if (acknowledgment.isPraying !== (acknowledgedAt !== null))
		throw dataUnavailable();
	return {
		isPraying: acknowledgment.isPraying,
		revision: requireRevision(acknowledgment.revision),
		acknowledgedAt,
		firstNotificationEligibleAt: requireTimestamp(
			acknowledgment.firstNotificationEligibleAt,
		),
		supporter: {
			userId: acknowledgment.supporter.userId,
			displayName: acknowledgment.supporter.displayName,
		},
	};
};

export const setCommunityPrayerAcknowledgmentForAccount = async (
	userId: string,
	value: unknown,
	dependencies: ICommunityPostDependencies = {},
): Promise<ISetCommunityPrayerAcknowledgmentResult> => {
	const input = parseInput(
		parseSetCommunityPrayerAcknowledgmentRequest,
		value,
	);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const postReference = database.doc(
		`communities/${input.communityId}/posts/${input.postId}`,
	);
	const supportReference = acknowledgmentReference(
		database,
		input.communityId,
		input.postId,
		userId,
	);
	const receiptReference = operationReference(
		database,
		userId,
		'PrayerAcknowledgment',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const accountAccess = input.isPraying
			? await getCommunityAccess(
					transaction,
					database,
					userId,
					input.communityId,
				)
			: await requireAccountAndCommunity(
					transaction,
					database,
					userId,
					input.communityId,
				);
		if (input.isPraying) requireActiveCommunity(accountAccess.community);
		const [postSnapshot, supportSnapshot, receipt] = await Promise.all([
			transaction.get(postReference),
			transaction.get(supportReference),
			transaction.get(receiptReference),
		]);
		const post = requireParentPost(
			postSnapshot,
			input.communityId,
			input.postId,
		);
		if (!isPrayerThread(post))
			throw postError(
				'failed-precondition',
				'This post is not a prayer request.',
				'PrayerRequestRequired',
			);
		if (input.isPraying) {
			await requireUnblockedInteraction(
				transaction,
				database,
				userId,
				post.author.userId,
			);
			const publication = requirePrayerRequest(post);
			if (publication.content.prayerRequestStatus !== 'Current')
				throw postError(
					'failed-precondition',
					'This prayer request is no longer current.',
					'PrayerRequestRequired',
				);
		}
		const previous = assertReceipt(receipt, input);
		if (previous) {
			if (
				previous.postId !== input.postId ||
				previous.isPraying !== input.isPraying ||
				(previous.revision !== null &&
					typeof previous.revision !== 'number') ||
				!(previous.updatedAt instanceof Timestamp)
			)
				throw dataUnavailable();
			return {
				postId: input.postId,
				isPraying: input.isPraying,
				revision: previous.revision,
				updatedAt: serializeTimestamp(previous.updatedAt),
			};
		}
		const current = supportSnapshot.exists
			? acknowledgmentProjection(
					supportSnapshot,
					input.communityId,
					input.postId,
				)
			: null;
		let revision: number | null = current?.revision ?? null;
		if (!current && input.isPraying) {
			revision = 0;
			if (post.author.userId !== userId)
				createNotificationEvent(transaction, database, {
					category: 'PrayerSupport',
					communityId: input.communityId,
					postId: input.postId,
					replyId: null,
					actorUserId: userId,
					sourceId: userId,
					now,
				});
			transaction.create(supportReference, {
				schemaVersion: 1,
				communityId: input.communityId,
				postId: input.postId,
				supporter: {
					userId,
					displayName:
						'displayName' in accountAccess
							? accountAccess.displayName
							: '',
				},
				isPraying: true,
				revision,
				acknowledgedAt: now,
				firstNotificationEligibleAt: now,
				createdAt: now,
				updatedAt: now,
			});
		} else if (current && current.isPraying !== input.isPraying) {
			revision = nextRevision(current.revision);
			transaction.update(supportReference, {
				isPraying: input.isPraying,
				revision,
				acknowledgedAt: input.isPraying ? now : null,
				updatedAt: now,
				...(input.isPraying && 'displayName' in accountAccess
					? {
							supporter: {
								userId,
								displayName: accountAccess.displayName,
							},
						}
					: {}),
			});
		}
		transaction.create(receiptReference, {
			requestDigest: requestDigest(input),
			postId: input.postId,
			isPraying: input.isPraying,
			revision,
			updatedAt: now,
		});
		return {
			postId: input.postId,
			isPraying: input.isPraying,
			revision,
			updatedAt: serializeTimestamp(now),
		};
	});
};

const compareSupport = (
	left: ICommunityPrayerSupporter,
	right: ICommunityPrayerSupporter,
): number => {
	const seconds = left.acknowledgedAt.seconds - right.acknowledgedAt.seconds;
	if (seconds !== 0) return seconds;
	const nanoseconds =
		left.acknowledgedAt.nanoseconds - right.acknowledgedAt.nanoseconds;
	if (nanoseconds !== 0) return nanoseconds;
	if (left.userId < right.userId) return -1;
	if (left.userId > right.userId) return 1;
	return 0;
};

export const listCommunityPrayerSupportForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<IListCommunityPrayerSupportResult> => {
	const input = parseListInput(
		parseListCommunityPrayerSupportRequest,
		value,
	) as IListCommunityPrayerSupportRequest;
	return database.runTransaction(async (transaction) => {
		await getCommunityAccess(
			transaction,
			database,
			userId,
			input.communityId,
		);
		const postReference = database.doc(
			`communities/${input.communityId}/posts/${input.postId}`,
		);
		const postSnapshot = await transaction.get(postReference);
		const post = requireParentPost(
			postSnapshot,
			input.communityId,
			input.postId,
		);
		if (!isPrayerThread(post))
			throw postError(
				'failed-precondition',
				'This post is not a prayer request.',
				'PrayerRequestRequired',
			);
		if (
			post.publication.status === 'Published' &&
			(await isBlockedRelationship(
				transaction,
				database,
				userId,
				post.author.userId,
			))
		)
			throw postError(
				'not-found',
				'This post is unavailable.',
				'PostUnavailable',
			);
		const memberships = await transaction.get(
			database
				.collection(`communities/${input.communityId}/members`)
				.where('lifecycle.status', '==', 'Active')
				.limit(CommunityPostLimits.maxActiveMembers + 1),
		);
		if (memberships.size > CommunityPostLimits.maxActiveMembers)
			throw dataUnavailable();
		const hasInvalidMembership = memberships.docs.some((snapshot) => {
			const member = snapshot.data();
			return !(
				member.schemaVersion === 1 &&
				member.communityId === input.communityId &&
				member.userId === snapshot.id &&
				(member.role === 'Organizer' || member.role === 'Member') &&
				member.lifecycle?.status === 'Active'
			);
		});
		if (hasInvalidMembership) throw dataUnavailable();
		const candidateUserIds = memberships.docs.map(
			(snapshot) => snapshot.id,
		);
		const deletionTasks = await Promise.all(
			candidateUserIds.map((memberUserId) =>
				transaction.get(
					database.doc(
						`communityAccountDeletionCleanup/${memberUserId}`,
					),
				),
			),
		);
		const activeUserIds = candidateUserIds.filter(
			(_, index) => !deletionTasks[index].exists,
		);
		const supportSnapshots = await Promise.all(
			activeUserIds.map((memberUserId) =>
				transaction.get(
					acknowledgmentReference(
						database,
						input.communityId,
						input.postId,
						memberUserId,
					),
				),
			),
		);
		const acknowledgments = supportSnapshots
			.filter((snapshot) => snapshot.exists)
			.map((snapshot) =>
				acknowledgmentProjection(
					snapshot,
					input.communityId,
					input.postId,
				),
			);
		const allSupporters: ICommunityPrayerSupporter[] = acknowledgments
			.filter(
				(acknowledgment) =>
					acknowledgment.isPraying &&
					acknowledgment.acknowledgedAt !== null,
			)
			.map((acknowledgment) => ({
				...acknowledgment.supporter,
				acknowledgedAt: serializeTimestamp(
					acknowledgment.acknowledgedAt as Timestamp,
				),
			}))
			.sort(compareSupport);
		const visible = await Promise.all(
			allSupporters.map(
				async (supporter) =>
					supporter.userId === userId ||
					!(await isBlockedRelationship(
						transaction,
						database,
						userId,
						supporter.userId,
					)),
			),
		);
		const supporters = allSupporters.filter((_, index) => visible[index]);
		const cursor = input.cursor
			? decodeCursor(
					input.cursor,
					'CommunityPrayerSupport',
					input.communityId,
					input.postId,
				)
			: null;
		const startIndex = cursor
			? supporters.findIndex(
					(supporter) =>
						supporter.acknowledgedAt.seconds > cursor.seconds ||
						(supporter.acknowledgedAt.seconds === cursor.seconds &&
							(supporter.acknowledgedAt.nanoseconds >
								cursor.nanoseconds ||
								(supporter.acknowledgedAt.nanoseconds ===
									cursor.nanoseconds &&
									supporter.userId > cursor.recordId))),
				)
			: 0;
		const normalizedStartIndex =
			startIndex < 0 ? supporters.length : startIndex;
		const pageSize = input.pageSize ?? CommunityPostLimits.defaultPageSize;
		const page = supporters.slice(
			normalizedStartIndex,
			normalizedStartIndex + pageSize,
		);
		const last = page[page.length - 1];
		return {
			postId: input.postId,
			supporters: page,
			supportCount: supporters.length,
			viewerIsPraying: acknowledgments.some(
				(acknowledgment) =>
					acknowledgment.supporter.userId === userId &&
					acknowledgment.isPraying,
			),
			nextCursor:
				normalizedStartIndex + page.length < supporters.length && last
					? encodeCursor(
							'CommunityPrayerSupport',
							input.communityId,
							input.postId,
							new Timestamp(
								last.acknowledgedAt.seconds,
								last.acknowledgedAt.nanoseconds,
							),
							last.userId,
						)
					: null,
		};
	});
};

export const createCommunityReply = onCall(async (request) =>
	createCommunityReplyForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);

export const listCommunityReplies = onCall(async (request) =>
	listCommunityRepliesForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);

export const editCommunityReply = onCall(async (request) =>
	editCommunityReplyForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);

export const deleteCommunityReply = onCall(async (request) =>
	deleteCommunityReplyForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);

export const setCommunityPrayerRequestStatus = onCall(async (request) =>
	setCommunityPrayerRequestStatusForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);

export const setCommunityPrayerAcknowledgment = onCall(async (request) =>
	setCommunityPrayerAcknowledgmentForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);

export const listCommunityPrayerSupport = onCall(async (request) =>
	listCommunityPrayerSupportForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);
