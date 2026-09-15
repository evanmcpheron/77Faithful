import {
	FieldPath,
	getFirestore,
	Timestamp,
	type DocumentData,
	type Firestore,
	type Transaction,
} from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
	CommunitySafetyLimits,
	parseBlockCommunityMemberRequest,
	parseListBlockedCommunityMembersRequest,
	parseReportCommunityContentRequest,
	parseUnblockCommunityMemberRequest,
} from '../../generated/features/communities/community-safety';
import type {
	ICommunityBlockResult,
	IListBlockedCommunityMembersResult,
	TCommunitySafetyReasonCode,
} from '../../generated/types/community/community-block.types';
import type {
	IReportCommunityContentResult,
	TCommunityReportTarget,
} from '../../generated/types/community/community-moderation.types';
import { onCall } from './community-callable';
import {
	getCommunityAccess,
	postProjection,
	requirePostAccount,
} from './community-post';
import { resolveCommunityDisplayName } from './read-community';

const safetyError = (
	code: ConstructorParameters<typeof HttpsError>[0],
	reason: TCommunitySafetyReasonCode,
): HttpsError =>
	new HttpsError(
		code,
		'This community safety request could not be completed.',
		{ reason },
	);

const parse = <T>(parser: (value: unknown) => T, value: unknown): T => {
	try {
		return parser(value);
	} catch {
		throw safetyError('invalid-argument', 'InvalidInput');
	}
};

const digest = (value: object): string =>
	createHash('sha256').update(JSON.stringify(value)).digest('hex');
const windowStart = (now: Timestamp): number =>
	Math.floor(now.seconds / 600) * 600;
const configuredLimit = (name: string, defaultValue: number): number => {
	const value = process.env[name];
	if (value === undefined) return defaultValue;
	if (!/^[1-9][0-9]{0,2}$/.test(value) || Number(value) > 100)
		throw safetyError('internal', 'SafetyConfigurationUnavailable');
	return Number(value);
};

const requireAccount = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
): Promise<void> => {
	if (!(await transaction.get(database.doc(`users/${userId}`))).exists)
		throw safetyError('failed-precondition', 'AccountUnavailable');
};

export const isBlockedRelationship = async (
	transaction: Transaction,
	database: Firestore,
	viewerId: string,
	otherId: string,
): Promise<boolean> => {
	if (viewerId === otherId) return false;
	const [outgoing, incoming] = await Promise.all([
		transaction.get(
			database.doc(`users/${viewerId}/communityBlocks/${otherId}`),
		),
		transaction.get(
			database.doc(`users/${otherId}/communityBlocks/${viewerId}`),
		),
	]);
	return outgoing.exists || incoming.exists;
};

export const requireUnblockedInteraction = async (
	transaction: Transaction,
	database: Firestore,
	actorId: string,
	otherId: string,
): Promise<void> => {
	if (await isBlockedRelationship(transaction, database, actorId, otherId))
		throw safetyError('permission-denied', 'BlockedInteraction');
};

export const visibleToViewer = async <
	T extends { author: { userId: string }; publication: { status: string } },
>(
	transaction: Transaction,
	database: Firestore,
	viewerId: string,
	records: T[],
): Promise<T[]> => {
	const authors = [
		...new Set(
			records
				.filter(
					(record) =>
						record.publication.status === 'Published' &&
						record.author.userId !== viewerId,
				)
				.map((record) => record.author.userId),
		),
	];
	const blocked = await Promise.all(
		authors.map((authorId) =>
			isBlockedRelationship(transaction, database, viewerId, authorId),
		),
	);
	const hidden = new Set(authors.filter((_, index) => blocked[index]));
	return records.filter(
		(record) =>
			record.publication.status !== 'Published' ||
			!hidden.has(record.author.userId),
	);
};

// Deterministic, bounded first-pass policy for deliberately submitted community text only.
export const requireSafeSubmission = (text: string): void => {
	if (
		text.length > CommunitySafetyLimits.maxSubmittedText ||
		/(?:\b(?:kill|murder|rape)\s+(?:you|yourself|him|her|them)\b)|(?:\b(?:child|minor)\s+(?:sexual|pornographic)\b)|(?:\b(?:send|share)\s+(?:me\s+)?(?:your\s+)?(?:password|bank\s+login)\b)/i.test(
			text,
		)
	)
		throw safetyError('invalid-argument', 'SubmissionRejected');
};

export const consumeSubmissionBudget = async (
	transaction: Transaction,
	database: Firestore,
	actorId: string,
	now: Timestamp,
): Promise<void> => {
	const start = windowStart(now);
	const ref = database.doc(
		`users/${actorId}/communitySafetyRates/submissions_${start}`,
	);
	const snapshot = await transaction.get(ref);
	const count = snapshot.exists ? snapshot.get('count') : 0;
	if (typeof count !== 'number' || !Number.isInteger(count) || count < 0)
		throw safetyError('internal', 'AccountUnavailable');
	if (
		count >=
		configuredLimit(
			'COMMUNITY_SAFETY_POST_LIMIT',
			CommunitySafetyLimits.postAttemptsPerTenMinutes,
		)
	)
		throw safetyError('resource-exhausted', 'RateLimited');
	transaction.set(ref, {
		count: count + 1,
		windowStart: start,
		updatedAt: now,
	});
};

const reportEvidence = async (
	transaction: Transaction,
	database: Firestore,
	communityId: string,
	target: TCommunityReportTarget,
	community: DocumentData,
): Promise<{
	targetRevision: number;
	text?: string;
	targetUserId?: string;
	targetDisplayName?: string;
	targetRole?: 'Organizer' | 'Member';
	communityName?: string;
	communityPurpose?: string;
}> => {
	if (target.targetType === 'Community') {
		if (
			typeof community.name !== 'string' ||
			community.name.length > 100 ||
			typeof community.purpose !== 'string' ||
			community.purpose.length > 2000
		)
			throw safetyError('internal', 'CommunityUnavailable');
		return {
			targetRevision:
				typeof community.revision === 'number' &&
				Number.isInteger(community.revision)
					? community.revision
					: 0,
			communityName: community.name,
			communityPurpose: community.purpose,
		};
	}
	if (target.targetType === 'Member') {
		const [membership, profile] = await Promise.all([
			transaction.get(
				database.doc(
					`communities/${communityId}/members/${target.userId}`,
				),
			),
			transaction.get(database.doc(`users/${target.userId}`)),
		]);
		if (
			!membership.exists ||
			membership.get('communityId') !== communityId ||
			membership.get('userId') !== target.userId ||
			membership.get('lifecycle.status') !== 'Active'
		)
			throw safetyError('not-found', 'TargetUnavailable');
		return {
			targetRevision: 0,
			targetUserId: target.userId,
			targetDisplayName: resolveCommunityDisplayName(
				profile.get('preferredName'),
			),
			targetRole:
				community.organizerUserId === target.userId &&
				membership.get('role') === 'Organizer'
					? 'Organizer'
					: 'Member',
		};
	}
	if (target.targetType === 'Message')
		throw safetyError('invalid-argument', 'InvalidInput');
	const postSnapshot = await transaction.get(
		database.doc(`communities/${communityId}/posts/${target.postId}`),
	);
	if (!postSnapshot.exists)
		throw safetyError('not-found', 'TargetUnavailable');
	const post = postProjection(postSnapshot, communityId);
	if (target.targetType === 'Post') {
		return {
			targetRevision: post.revision,
			targetUserId: post.author.userId,
			...(post.publication.status === 'Published'
				? { text: post.publication.content.text }
				: {}),
		};
	}
	const reply = await transaction.get(
		database.doc(
			`communities/${communityId}/posts/${target.postId}/replies/${target.replyId}`,
		),
	);
	const data = reply.data();
	if (
		!data ||
		data.communityId !== communityId ||
		data.postId !== target.postId ||
		!Number.isInteger(data.revision) ||
		typeof data.author?.userId !== 'string'
	)
		throw safetyError('not-found', 'TargetUnavailable');
	return {
		targetRevision: data.revision,
		targetUserId: data.author.userId,
		...(data.publication?.status === 'Published' &&
		typeof data.publication.text === 'string'
			? { text: data.publication.text }
			: {}),
	};
};

export const reportCommunityContentForAccount = async (
	actorId: string,
	value: unknown,
	database = getFirestore(),
	now = Timestamp.now(),
): Promise<IReportCommunityContentResult> => {
	const input = parse(parseReportCommunityContentRequest, value);
	const requestDigest = digest({ ...input, operationId: undefined });
	const receiptRef = database.doc(
		`users/${actorId}/communityReportOperations/${input.operationId}`,
	);
	const reportRef = database.collection('communitySafetyReports').doc();
	return database.runTransaction(async (transaction) => {
		const access = await getCommunityAccess(
			transaction,
			database,
			actorId,
			input.communityId,
		);
		const receipt = await transaction.get(receiptRef);
		if (receipt.exists) {
			if (receipt.get('requestDigest') !== requestDigest)
				throw safetyError('already-exists', 'OperationPayloadMismatch');
			return { reportId: receipt.get('reportId'), status: 'Submitted' };
		}
		const evidence = await reportEvidence(
			transaction,
			database,
			input.communityId,
			input.target,
			access.community,
		);
		if (
			evidence.targetUserId &&
			input.target.targetType !== 'Member' &&
			(await isBlockedRelationship(
				transaction,
				database,
				actorId,
				evidence.targetUserId,
			))
		)
			throw safetyError('not-found', 'TargetUnavailable');
		const duplicateKey = digest({
			communityId: input.communityId,
			target: input.target,
			reason: input.reason,
			revision: evidence.targetRevision,
		});
		const duplicateRef = database.doc(
			`users/${actorId}/communityReportDuplicates/${duplicateKey}`,
		);
		const duplicate = await transaction.get(duplicateRef);
		if (duplicate.exists) {
			const reportId = duplicate.get('reportId');
			if (typeof reportId !== 'string')
				throw safetyError('internal', 'TargetUnavailable');
			transaction.create(receiptRef, {
				requestDigest,
				reportId,
				createdAt: now,
			});
			return { reportId, status: 'Submitted' };
		}
		const start = windowStart(now);
		const rateRef = database.doc(
			`users/${actorId}/communitySafetyRates/reports_${start}`,
		);
		const rate = await transaction.get(rateRef);
		const count = rate.exists ? rate.get('count') : 0;
		if (typeof count !== 'number' || !Number.isInteger(count) || count < 0)
			throw safetyError('internal', 'AccountUnavailable');
		if (
			count >=
			configuredLimit(
				'COMMUNITY_SAFETY_REPORT_LIMIT',
				CommunitySafetyLimits.reportAttemptsPerTenMinutes,
			)
		)
			throw safetyError('resource-exhausted', 'RateLimited');
		transaction.set(rateRef, {
			count: count + 1,
			windowStart: start,
			updatedAt: now,
		});
		transaction.create(reportRef, {
			schemaVersion: 1,
			communityId: input.communityId,
			reporterUserId: actorId,
			target: input.target,
			reason: input.reason,
			...(input.explanation === undefined
				? {}
				: { explanation: input.explanation }),
			evidence,
			review: { status: 'Submitted' },
			revision: 0,
			createdAt: now,
			updatedAt: now,
		});
		transaction.create(receiptRef, {
			requestDigest,
			reportId: reportRef.id,
			createdAt: now,
		});
		transaction.create(duplicateRef, {
			reportId: reportRef.id,
			createdAt: now,
		});
		return { reportId: reportRef.id, status: 'Submitted' };
	});
};

export const blockCommunityMemberForAccount = async (
	actorId: string,
	value: unknown,
	database = getFirestore(),
	now = Timestamp.now(),
): Promise<ICommunityBlockResult> => {
	const input = parse(parseBlockCommunityMemberRequest, value);
	if (input.memberUserId === actorId)
		throw safetyError('invalid-argument', 'SelfTarget');
	const blockRef = database.doc(
		`users/${actorId}/communityBlocks/${input.memberUserId}`,
	);
	const receiptRef = database.doc(
		`users/${actorId}/communityBlockOperations/${input.operationId}`,
	);
	const requestDigest = digest({
		communityId: input.communityId,
		memberUserId: input.memberUserId,
	});
	return database.runTransaction(async (transaction) => {
		await getCommunityAccess(
			transaction,
			database,
			actorId,
			input.communityId,
		);
		const [membership, receipt, existing, profile] = await Promise.all([
			transaction.get(
				database.doc(
					`communities/${input.communityId}/members/${input.memberUserId}`,
				),
			),
			transaction.get(receiptRef),
			transaction.get(blockRef),
			transaction.get(database.doc(`users/${input.memberUserId}`)),
		]);
		if (
			!membership.exists ||
			membership.get('communityId') !== input.communityId ||
			membership.get('userId') !== input.memberUserId ||
			membership.get('lifecycle.status') !== 'Active' ||
			!profile.exists
		)
			throw safetyError('not-found', 'TargetUnavailable');
		if (receipt.exists) {
			if (receipt.get('requestDigest') !== requestDigest)
				throw safetyError('already-exists', 'OperationPayloadMismatch');
			return {
				memberUserId: input.memberUserId,
				isBlocked: existing.exists,
			};
		}
		if (!existing.exists)
			transaction.create(blockRef, {
				schemaVersion: 1,
				ownerUserId: actorId,
				blockedUserId: input.memberUserId,
				displayName: resolveCommunityDisplayName(
					profile.get('preferredName'),
				),
				createdAt: now,
			});
		transaction.create(receiptRef, { requestDigest, createdAt: now });
		return { memberUserId: input.memberUserId, isBlocked: true };
	});
};

export const unblockCommunityMemberForAccount = async (
	actorId: string,
	value: unknown,
	database = getFirestore(),
	now = Timestamp.now(),
): Promise<ICommunityBlockResult> => {
	const input = parse(parseUnblockCommunityMemberRequest, value);
	if (input.memberUserId === actorId)
		throw safetyError('invalid-argument', 'SelfTarget');
	const blockRef = database.doc(
		`users/${actorId}/communityBlocks/${input.memberUserId}`,
	);
	const receiptRef = database.doc(
		`users/${actorId}/communityUnblockOperations/${input.operationId}`,
	);
	const requestDigest = digest({ memberUserId: input.memberUserId });
	return database.runTransaction(async (transaction) => {
		await requireAccount(transaction, database, actorId);
		const [existing, receipt] = await Promise.all([
			transaction.get(blockRef),
			transaction.get(receiptRef),
		]);
		if (receipt.exists) {
			if (receipt.get('requestDigest') !== requestDigest)
				throw safetyError('already-exists', 'OperationPayloadMismatch');
			return {
				memberUserId: input.memberUserId,
				isBlocked: existing.exists,
			};
		}
		if (existing.exists) transaction.delete(blockRef);
		transaction.create(receiptRef, { requestDigest, createdAt: now });
		return { memberUserId: input.memberUserId, isBlocked: false };
	});
};

export const listBlockedCommunityMembersForAccount = async (
	actorId: string,
	value: unknown,
	database = getFirestore(),
): Promise<IListBlockedCommunityMembersResult> => {
	const input = parse(parseListBlockedCommunityMembersRequest, value);
	const pageSize = input.pageSize ?? 20;
	return database.runTransaction(async (transaction) => {
		await requireAccount(transaction, database, actorId);
		let query = database
			.collection(`users/${actorId}/communityBlocks`)
			.orderBy(FieldPath.documentId());
		if (input.cursor) {
			let cursor: unknown;
			try {
				cursor = JSON.parse(
					Buffer.from(input.cursor, 'base64url').toString('utf8'),
				);
			} catch {
				throw safetyError('invalid-argument', 'InvalidCursor');
			}
			if (
				!cursor ||
				typeof cursor !== 'object' ||
				Array.isArray(cursor) ||
				Object.keys(cursor).length !== 2 ||
				(cursor as Record<string, unknown>)['owner'] !== actorId ||
				typeof (cursor as Record<string, unknown>)['last'] !==
					'string' ||
				!/^[a-zA-Z0-9_-]{1,128}$/.test(
					(cursor as Record<string, unknown>)['last'] as string,
				)
			)
				throw safetyError('invalid-argument', 'InvalidCursor');
			query = query.startAfter(
				(cursor as Record<string, string>)['last'],
			);
		}
		const snapshots = await transaction.get(query.limit(pageSize + 1));
		const page = snapshots.docs.slice(0, pageSize);
		return {
			members: page.map((snapshot) => {
				const data = snapshot.data();
				if (
					data.schemaVersion !== 1 ||
					data.ownerUserId !== actorId ||
					data.blockedUserId !== snapshot.id ||
					typeof data.displayName !== 'string' ||
					data.displayName.length > 80 ||
					!(data.createdAt instanceof Timestamp)
				)
					throw safetyError('internal', 'TargetUnavailable');
				return {
					blockedUserId: snapshot.id,
					displayName: data.displayName,
				};
			}),
			nextCursor:
				snapshots.size > pageSize && page.length > 0
					? Buffer.from(
							JSON.stringify({
								owner: actorId,
								last: page[page.length - 1].id,
							}),
						).toString('base64url')
					: null,
		};
	});
};

export const reportCommunityContent = onCall(async (request) =>
	reportCommunityContentForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);
export const blockCommunityMember = onCall(async (request) =>
	blockCommunityMemberForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);
export const unblockCommunityMember = onCall(async (request) =>
	unblockCommunityMemberForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);
export const listBlockedCommunityMembers = onCall(async (request) =>
	listBlockedCommunityMembersForAccount(
		requirePostAccount(request.auth),
		request.data,
	),
);
