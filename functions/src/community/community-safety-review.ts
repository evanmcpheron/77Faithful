import { getAuth, type Auth } from 'firebase-admin/auth';
import {
	FieldPath,
	getFirestore,
	Timestamp,
	type Firestore,
	type Transaction,
} from 'firebase-admin/firestore';
import {
	HttpsError,
	onCall,
	type CallableRequest,
} from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
	parseClaimCommunitySafetyReportRequest,
	parseGetCommunitySafetyReportRequest,
	parseListCommunitySafetyReportsRequest,
	parseReviewCommunityReportRequest,
} from '../../generated/features/communities/community-safety';
import type { ICommunityMembershipDocument } from '../../generated/types/community/community-membership.types';
import type {
	IClaimCommunitySafetyReportResult,
	ICommunityModerationActionDocument,
	ICommunityReportDocument,
	ICommunitySafetyCurrentTarget,
	ICommunitySafetyReportQueueItem,
	IGetCommunitySafetyReportResult,
	IListCommunitySafetyReportsResult,
	IReviewCommunityReportRequest,
	IReviewCommunityReportResult,
	TCommunityReportTarget,
} from '../../generated/types/community/community-moderation.types';
import { queueCommunityExitCleanup } from './community-cleanup';

const identifier = /^[a-zA-Z0-9_-]{1,128}$/;
const invitationDigest = /^[a-f0-9]{64}$/;
const CLAIM_TIMEOUT_MILLISECONDS = 60 * 60 * 1000;
const hash = (value: string): string =>
	createHash('sha256').update(value, 'utf8').digest('hex');
const error = (
	code: ConstructorParameters<typeof HttpsError>[0],
	reason: string,
) =>
	new HttpsError(code, 'This safety review could not be completed.', {
		reason,
	});
const parse = <T>(parser: (value: unknown) => T, value: unknown): T => {
	try {
		return parser(value);
	} catch {
		throw error('invalid-argument', 'InvalidInput');
	}
};

const reviewerId = (auth: CallableRequest['auth']): string => {
	if (!auth) throw error('unauthenticated', 'AuthenticationRequired');
	if (auth.token.email_verified !== true)
		throw error('permission-denied', 'EmailVerificationRequired');
	return auth.uid;
};

// Current Auth state, rather than a possibly stale callable token or community role.
const requireReviewer = async (
	userId: string,
	authentication: Auth,
): Promise<void> => {
	try {
		const user = await authentication.getUser(userId);
		if (
			user.disabled ||
			user.emailVerified !== true ||
			user.customClaims?.communitySafetyReviewer !== true
		)
			throw error('permission-denied', 'ReviewerRequired');
	} catch (caught) {
		if (caught instanceof HttpsError) throw caught;
		throw error('permission-denied', 'ReviewerRequired');
	}
};

const reportData = (
	data: FirebaseFirestore.DocumentData | undefined,
	reportId: string,
): ICommunityReportDocument => {
	if (
		!data ||
		data.schemaVersion !== 1 ||
		!identifier.test(data.communityId) ||
		!identifier.test(data.reporterUserId) ||
		!data.target ||
		!['Post', 'Reply', 'Member', 'Community'].includes(
			data.target.targetType,
		) ||
		!data.evidence ||
		!Number.isInteger(data.evidence.targetRevision) ||
		!data.review ||
		!['Submitted', 'UnderReview', 'Resolved'].includes(
			data.review.status,
		) ||
		!Number.isInteger(data.revision) ||
		data.revision < 0 ||
		!(data.createdAt instanceof Timestamp) ||
		!(data.updatedAt instanceof Timestamp)
	)
		throw error('internal', 'ReportUnavailable');
	void reportId;
	return data as ICommunityReportDocument;
};

const requireIndependentReviewer = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	report: ICommunityReportDocument,
): Promise<void> => {
	if (
		report.reporterUserId === userId ||
		report.evidence.targetUserId === userId
	)
		throw error('permission-denied', 'ReviewerConflict');
	if (report.target.targetType === 'Community') {
		const community = await transaction.get(
			database.doc(`communities/${report.communityId}`),
		);
		if (community.get('organizerUserId') === userId)
			throw error('permission-denied', 'ReviewerConflict');
	}
};

const readCurrentTarget = async (
	transaction: Transaction,
	database: Firestore,
	communityId: string,
	target: TCommunityReportTarget,
): Promise<ICommunitySafetyCurrentTarget> => {
	const community = await transaction.get(
		database.doc(`communities/${communityId}`),
	);
	const group = community.data();
	if (
		!group ||
		!Number.isInteger(group.revision) ||
		!['Active', 'Closed'].includes(group.lifecycle?.status)
	)
		throw error('not-found', 'CommunityUnavailable');
	if (target.targetType === 'Community')
		return {
			revision: group.revision,
			status: group.lifecycle.status,
			text: `${group.name}\n${group.purpose}`,
			textDigest: hash(`${group.name}\n${group.purpose}`),
		};
	if (target.targetType === 'Member') {
		const member = await transaction.get(
			database.doc(`communities/${communityId}/members/${target.userId}`),
		);
		const data = member.data();
		if (
			!data ||
			data.communityId !== communityId ||
			data.userId !== target.userId
		)
			throw error('not-found', 'TargetUnavailable');
		return {
			revision: 0,
			status: data.lifecycle?.status,
			userId: target.userId,
			role: data.role,
		};
	}
	if (target.targetType === 'Message')
		throw error('failed-precondition', 'UnsupportedTarget');
	const post = await transaction.get(
		database.doc(`communities/${communityId}/posts/${target.postId}`),
	);
	const postData = post.data();
	if (!postData || postData.communityId !== communityId)
		throw error('not-found', 'TargetUnavailable');
	const data =
		target.targetType === 'Reply'
			? (
					await transaction.get(
						database.doc(
							`communities/${communityId}/posts/${target.postId}/replies/${target.replyId}`,
						),
					)
				).data()
			: postData;
	if (
		!data ||
		data.communityId !== communityId ||
		(target.targetType === 'Reply' && data.postId !== target.postId) ||
		!Number.isInteger(data.revision) ||
		!data.publication
	)
		throw error('not-found', 'TargetUnavailable');
	const text: unknown =
		target.targetType === 'Post'
			? data.publication.content?.text
			: data.publication.text;
	return {
		revision: data.revision,
		status: data.publication.status,
		...(data.publication.status === 'Published' && typeof text === 'string'
			? { text, textDigest: hash(text) }
			: {}),
	};
};

const queueItem = (
	reportId: string,
	report: ICommunityReportDocument,
): ICommunitySafetyReportQueueItem => ({
	reportId,
	communityId: report.communityId,
	reporterUserId: report.reporterUserId,
	target: report.target,
	reason: report.reason,
	status: report.review.status,
	revision: report.revision,
	createdAt: report.createdAt,
});

export const listCommunitySafetyReportsForReviewer = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
	authentication = getAuth(),
): Promise<IListCommunitySafetyReportsResult> => {
	const input = parse(parseListCommunitySafetyReportsRequest, value);
	await requireReviewer(userId, authentication);
	let query = database
		.collection('communitySafetyReports')
		.where('review.status', 'in', ['Submitted', 'UnderReview'])
		.orderBy(FieldPath.documentId())
		.limit((input.pageSize ?? 20) + 1);
	if (input.cursor) query = query.startAfter(input.cursor);
	const page = await query.get();
	await requireReviewer(userId, authentication);
	const selected = page.docs.slice(0, input.pageSize ?? 20);
	return {
		reports: selected.map((snapshot) =>
			queueItem(snapshot.id, reportData(snapshot.data(), snapshot.id)),
		),
		nextCursor:
			page.docs.length > selected.length
				? selected[selected.length - 1].id
				: null,
	};
};

export const claimCommunitySafetyReportForReviewer = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
	authentication = getAuth(),
	now = Timestamp.now(),
): Promise<IClaimCommunitySafetyReportResult> => {
	const input = parse(parseClaimCommunitySafetyReportRequest, value);
	const receiptRef = database.doc(
		`users/${userId}/communitySafetyClaimOperations/${input.operationId}`,
	);
	const reportRef = database.doc(`communitySafetyReports/${input.reportId}`);
	const requestDigest = hash(
		JSON.stringify({
			reportId: input.reportId,
			expectedRevision: input.expectedRevision,
		}),
	);
	await requireReviewer(userId, authentication);
	return database.runTransaction(async (transaction) => {
		await requireReviewer(userId, authentication);
		const [snapshot, receipt] = await Promise.all([
			transaction.get(reportRef),
			transaction.get(receiptRef),
		]);
		if (!snapshot.exists) throw error('not-found', 'ReportUnavailable');
		const report = reportData(snapshot.data(), input.reportId);
		await requireIndependentReviewer(transaction, database, userId, report);
		if (receipt.exists) {
			if (receipt.get('requestDigest') !== requestDigest)
				throw error('already-exists', 'OperationPayloadMismatch');
			if (
				report.review.status !== 'UnderReview' ||
				report.review.reviewerUserId !== userId
			)
				throw error('aborted', 'RevisionConflict');
			return {
				reportId: input.reportId,
				status: 'UnderReview',
				revision: receipt.get('revision'),
			};
		}
		const claimExpired =
			report.review.status === 'UnderReview' &&
			report.review.reviewStartedAt instanceof Timestamp &&
			now.toMillis() - report.review.reviewStartedAt.toMillis() >=
				CLAIM_TIMEOUT_MILLISECONDS;
		if (
			report.revision !== input.expectedRevision ||
			(report.review.status !== 'Submitted' && !claimExpired)
		)
			throw error('aborted', 'RevisionConflict');
		transaction.update(reportRef, {
			review: {
				status: 'UnderReview',
				reviewerUserId: userId,
				reviewStartedAt: now,
			},
			revision: report.revision + 1,
			updatedAt: now,
		});
		transaction.create(receiptRef, {
			requestDigest,
			reportId: input.reportId,
			revision: report.revision + 1,
			createdAt: now,
		});
		return {
			reportId: input.reportId,
			status: 'UnderReview',
			revision: report.revision + 1,
		};
	});
};

export const getCommunitySafetyReportForReviewer = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
	authentication = getAuth(),
): Promise<IGetCommunitySafetyReportResult> => {
	const input = parse(parseGetCommunitySafetyReportRequest, value);
	await requireReviewer(userId, authentication);
	const result = await database.runTransaction(async (transaction) => {
		await requireReviewer(userId, authentication);
		const snapshot = await transaction.get(
			database.doc(`communitySafetyReports/${input.reportId}`),
		);
		if (!snapshot.exists) throw error('not-found', 'ReportUnavailable');
		const report = reportData(snapshot.data(), input.reportId);
		await requireIndependentReviewer(transaction, database, userId, report);
		return {
			reportId: input.reportId,
			report,
			currentTarget: await readCurrentTarget(
				transaction,
				database,
				report.communityId,
				report.target,
			),
		};
	});
	await requireReviewer(userId, authentication);
	return result;
};

const assertDecision = (
	input: IReviewCommunityReportRequest,
	report: ICommunityReportDocument,
	current: ICommunitySafetyCurrentTarget,
): void => {
	if (
		report.revision !== input.expectedRevision ||
		current.revision !== input.expectedTargetRevision
	)
		throw error('aborted', 'RevisionConflict');
	const kind = report.target.targetType;
	if (
		(input.requestedAction === 'RemoveContent' &&
			!['Post', 'Reply'].includes(kind)) ||
		(input.requestedAction === 'RemoveMember' && kind !== 'Member') ||
		(input.requestedAction === 'CloseCommunity' && kind !== 'Community')
	)
		throw error('invalid-argument', 'ActionTargetMismatch');
	if (
		input.requestedAction === 'RemoveContent' &&
		current.status !== 'Published'
	)
		throw error('failed-precondition', 'TargetUnavailable');
	if (input.requestedAction === 'RemoveMember' && current.status !== 'Active')
		throw error('failed-precondition', 'TargetUnavailable');
	if (
		input.requestedAction === 'CloseCommunity' &&
		current.status !== 'Active'
	)
		throw error('failed-precondition', 'CommunityClosed');
	if (
		current.revision !== report.evidence.targetRevision &&
		current.textDigest !== undefined &&
		input.reviewedCurrentTextDigest !== current.textDigest
	)
		throw error('failed-precondition', 'CurrentContentReviewRequired');
};

export const reviewCommunityReportForReviewer = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
	authentication = getAuth(),
	now = Timestamp.now(),
): Promise<IReviewCommunityReportResult> => {
	const input = parse(parseReviewCommunityReportRequest, value);
	const requestDigest = hash(
		JSON.stringify({
			...input,
			operationId: undefined,
			explanation: hash(input.explanation),
		}),
	);
	const receiptRef = database.doc(
		`users/${userId}/communitySafetyReviewOperations/${input.operationId}`,
	);
	const reportRef = database.doc(`communitySafetyReports/${input.reportId}`);
	const actionRef = database.collection('communityModerationActions').doc();
	await requireReviewer(userId, authentication);
	return database.runTransaction(async (transaction) => {
		await requireReviewer(userId, authentication);
		const [snapshot, receipt] = await Promise.all([
			transaction.get(reportRef),
			transaction.get(receiptRef),
		]);
		if (!snapshot.exists) throw error('not-found', 'ReportUnavailable');
		const report = reportData(snapshot.data(), input.reportId);
		await requireIndependentReviewer(transaction, database, userId, report);
		if (receipt.exists) {
			if (receipt.get('requestDigest') !== requestDigest)
				throw error('already-exists', 'OperationPayloadMismatch');
			if (
				report.review.status !== 'Resolved' ||
				report.review.moderationActionId !==
					receipt.get('moderationActionId')
			)
				throw error('aborted', 'RevisionConflict');
			return {
				reportId: input.reportId,
				moderationActionId: receipt.get('moderationActionId'),
				status: 'Resolved',
			};
		}
		if (
			report.review.status !== 'Submitted' &&
			(report.review.status !== 'UnderReview' ||
				report.review.reviewerUserId !== userId)
		)
			throw error('aborted', 'RevisionConflict');
		const current = await readCurrentTarget(
			transaction,
			database,
			report.communityId,
			report.target,
		);
		assertDecision(input, report, current);
		const communityRef = database.doc(`communities/${report.communityId}`);
		const communitySnapshot = await transaction.get(communityRef);
		const community = communitySnapshot.data();
		if (!community) throw error('not-found', 'CommunityUnavailable');
		if (input.requestedAction === 'RemoveContent') {
			const target = report.target;
			if (target.targetType !== 'Post' && target.targetType !== 'Reply')
				throw error('internal', 'ActionTargetMismatch');
			const contentRef = database.doc(
				target.targetType === 'Post'
					? `communities/${report.communityId}/posts/${target.postId}`
					: `communities/${report.communityId}/posts/${target.postId}/replies/${target.replyId}`,
			);
			const content = (await transaction.get(contentRef)).data();
			if (!content || content.revision !== current.revision)
				throw error('aborted', 'RevisionConflict');
			transaction.update(contentRef, {
				publication:
					target.targetType === 'Post'
						? {
								status: 'ModeratorRemoved',
								postType: content.publication.content.postType,
								removedAt: now,
							}
						: { status: 'ModeratorRemoved', removedAt: now },
				revision: current.revision + 1,
				updatedAt: now,
			});
		}
		if (input.requestedAction === 'RemoveMember') {
			const target = report.target;
			if (target.targetType !== 'Member')
				throw error('internal', 'ActionTargetMismatch');
			if (community.organizerUserId === target.userId)
				throw error(
					'failed-precondition',
					'OrganizerEscalationRequired',
				);
			const memberRef = database.doc(
				`communities/${report.communityId}/members/${target.userId}`,
			);
			const member = (await transaction.get(memberRef)).data() as
				ICommunityMembershipDocument | undefined;
			const removalRef = database.doc(
				`communities/${report.communityId}/memberRemovals/${target.userId}`,
			);
			const removal = await transaction.get(removalRef);
			if (
				!member ||
				member.lifecycle.status !== 'Active' ||
				member.role === 'Organizer' ||
				removal.exists
			)
				throw error('failed-precondition', 'TargetUnavailable');
			const updated: ICommunityMembershipDocument = {
				...member,
				role: 'Member',
				lifecycle: { status: 'Removed', removedAt: now },
				updatedAt: now,
			};
			transaction.set(memberRef, updated);
			transaction.set(
				database.doc(
					`users/${target.userId}/communityMemberships/${report.communityId}`,
				),
				updated,
			);
			queueCommunityExitCleanup(
				transaction,
				database,
				report.communityId,
				target.userId,
				now,
			);
			transaction.create(removalRef, {
				schemaVersion: 1,
				communityId: report.communityId,
				memberUserId: target.userId,
				removedByUserId: userId,
				privateReason: 'Platform safety review',
				removedAt: now,
				createdAt: now,
				updatedAt: now,
			});
		}
		if (input.requestedAction === 'CloseCommunity') {
			const activeId: unknown = community.activeInvitationId;
			if (
				activeId != null &&
				(typeof activeId !== 'string' || !identifier.test(activeId))
			)
				throw error('internal', 'CommunityUnavailable');
			if (activeId) {
				const invitationRef = database.doc(
					`communities/${report.communityId}/invitations/${activeId}`,
				);
				const invitation = (
					await transaction.get(invitationRef)
				).data();
				if (invitation?.lifecycle?.status === 'Active')
					transaction.update(invitationRef, {
						lifecycle: { status: 'Revoked', revokedAt: now },
						updatedAt: now,
					});
				if (
					typeof invitation?.tokenDigest === 'string' &&
					invitationDigest.test(invitation.tokenDigest)
				)
					transaction.delete(
						database.doc(
							`communityInvitationDigests/${invitation.tokenDigest}`,
						),
					);
			}
			transaction.update(communityRef, {
				lifecycle: { status: 'Closed', closedAt: now },
				activeInvitationId: null,
				revision: community.revision + 1,
				updatedAt: now,
			});
		}
		const decision = {
			action: input.requestedAction,
			target: report.target,
		} as ICommunityModerationActionDocument['decision'];
		const action: ICommunityModerationActionDocument = {
			schemaVersion: 1,
			communityId: report.communityId,
			reportId: input.reportId,
			decidedByUserId: userId,
			decision,
			explanation: input.explanation,
			targetRevision: current.revision,
			reportRevision: report.revision,
			createdAt: now,
		};
		transaction.create(actionRef, action);
		transaction.update(reportRef, {
			review: {
				status: 'Resolved',
				moderationActionId: actionRef.id,
				reviewerUserId: userId,
				resolvedAt: now,
			},
			revision: report.revision + 1,
			updatedAt: now,
		});
		transaction.create(receiptRef, {
			requestDigest,
			reportId: input.reportId,
			moderationActionId: actionRef.id,
			createdAt: now,
		});
		return {
			reportId: input.reportId,
			moderationActionId: actionRef.id,
			status: 'Resolved',
		};
	});
};

export const listCommunitySafetyReports = onCall(async (request) =>
	listCommunitySafetyReportsForReviewer(
		reviewerId(request.auth),
		request.data,
	),
);
export const claimCommunitySafetyReport = onCall(async (request) =>
	claimCommunitySafetyReportForReviewer(
		reviewerId(request.auth),
		request.data,
	),
);
export const getCommunitySafetyReport = onCall(async (request) =>
	getCommunitySafetyReportForReviewer(reviewerId(request.auth), request.data),
);
export const reviewCommunityReport = onCall(async (request) =>
	reviewCommunityReportForReviewer(reviewerId(request.auth), request.data),
);
