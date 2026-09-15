import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
	HttpsError,
	onCall,
	type CallableRequest,
} from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import { parseCreateCommunityResult } from '../../generated/features/communities/community-creation';
import {
	parseAcceptCommunityInvitationRequest,
	parsePreviewCommunityInvitationRequest,
} from '../../generated/features/communities/community-invitation';
import type {
	IAcceptCommunityInvitationRequest,
	IAcceptCommunityInvitationResult,
	IPreviewCommunityInvitationResult,
	TCommunityInvitationAcceptanceOutcome,
	TCommunityInvitationReasonCode,
} from '../../generated/types/community/community-function.types';
import type { ICommunityInvitationDocument } from '../../generated/types/community/community-invitation.types';
import type { ICommunityMembershipDocument } from '../../generated/types/community/community-membership.types';
import type { ICommunitySummary } from '../../generated/types/community/community.types';
import {
	parseStoredInvitation,
	timestampMilliseconds,
} from './community-invitation';
import { digestCommunityInvitationCode } from './community-invitation-crypto';
import { readCurrentCommunityJourney } from './community-journey';
import {
	requireCommunityAccount,
	resolveCommunityDisplayName,
} from './read-community';

const RATE_LIMIT_WINDOW_MILLISECONDS = 10 * 60 * 1000;
const identifierPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const digestPattern = /^[a-f0-9]{64}$/;

export const CommunityInvitationAttemptLimits = {
	previewPerAccount: 20,
	previewPerRequestScope: 40,
	acceptPerAccount: 10,
	acceptPerRequestScope: 20,
} as const;

interface IAttemptLimits {
	account: number;
	requestScope: number;
}

interface IInvitationRedemptionDependencies {
	database?: FirebaseFirestore.Firestore;
	now?: Timestamp;
	requestScopeDigest: string;
	attemptLimits?: {
		preview?: IAttemptLimits;
		accept?: IAttemptLimits;
	};
}

interface IResolvedInvitation {
	communityId: string;
	invitationId: string;
	invitation: ICommunityInvitationDocument;
	community: FirebaseFirestore.DocumentData;
	communityReference: FirebaseFirestore.DocumentReference;
	organizerProfile: FirebaseFirestore.DocumentSnapshot;
}

const invitationError = (
	code: ConstructorParameters<typeof HttpsError>[0],
	message: string,
	reason: TCommunityInvitationReasonCode,
): HttpsError => new HttpsError(code, message, { reason });

const invalidInput = (): HttpsError =>
	invitationError(
		'invalid-argument',
		'Enter a valid community invitation and name.',
		'InvalidInput',
	);

const invitationUnavailable = (): HttpsError =>
	invitationError(
		'failed-precondition',
		'This community invitation is no longer available.',
		'InvitationUnavailable',
	);

const dataUnavailable = (): HttpsError =>
	invitationError(
		'internal',
		'This community invitation could not be loaded.',
		'InvitationDataUnavailable',
	);

const parseInput = <T>(parser: (value: unknown) => T, value: unknown): T => {
	try {
		return parser(value);
	} catch {
		throw invalidInput();
	}
};

const hashRateLimitKey = (value: string): string =>
	createHash('sha256').update(value, 'utf8').digest('hex');

export const deriveCommunityInvitationRequestScope = (
	request: CallableRequest,
): string => {
	const address = request.rawRequest.ip || 'unknown';
	return hashRateLimitKey(`request:${address}`);
};

const readRateLimit = (
	data: FirebaseFirestore.DocumentData | undefined,
): { attemptCount: number; windowStartedAt: Timestamp } | null => {
	if (!data) return null;
	if (
		!Number.isInteger(data.attemptCount) ||
		data.attemptCount < 1 ||
		!(data.windowStartedAt instanceof Timestamp)
	)
		throw dataUnavailable();
	return {
		attemptCount: data.attemptCount,
		windowStartedAt: data.windowStartedAt,
	};
};

const consumeInvitationAttempt = async (
	userId: string,
	kind: 'Preview' | 'Accept',
	dependencies: IInvitationRedemptionDependencies,
): Promise<void> => {
	if (!digestPattern.test(dependencies.requestScopeDigest))
		throw dataUnavailable();
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const configured =
		kind === 'Preview'
			? dependencies.attemptLimits?.preview
			: dependencies.attemptLimits?.accept;
	const limits =
		configured ??
		(kind === 'Preview'
			? {
					account: CommunityInvitationAttemptLimits.previewPerAccount,
					requestScope:
						CommunityInvitationAttemptLimits.previewPerRequestScope,
				}
			: {
					account: CommunityInvitationAttemptLimits.acceptPerAccount,
					requestScope:
						CommunityInvitationAttemptLimits.acceptPerRequestScope,
				});
	const references = [
		database.doc(
			`communityInvitationRateLimits/${hashRateLimitKey(`${kind}:account:${userId}`)}`,
		),
		database.doc(
			`communityInvitationRateLimits/${hashRateLimitKey(`${kind}:request:${dependencies.requestScopeDigest}`)}`,
		),
	];
	await database.runTransaction(async (transaction) => {
		const snapshots = await Promise.all(
			references.map((reference) => transaction.get(reference)),
		);
		const current = snapshots.map((snapshot) =>
			readRateLimit(snapshot.data()),
		);
		const next = current.map((record) =>
			!record ||
			now.toMillis() - record.windowStartedAt.toMillis() >=
				RATE_LIMIT_WINDOW_MILLISECONDS
				? { attemptCount: 1, windowStartedAt: now }
				: {
						attemptCount: record.attemptCount + 1,
						windowStartedAt: record.windowStartedAt,
					},
		);
		if (
			next[0].attemptCount > limits.account ||
			next[1].attemptCount > limits.requestScope
		)
			throw invitationError(
				'resource-exhausted',
				'Too many invitation attempts. Please wait and try again.',
				'RateLimited',
			);
		for (const [index, reference] of references.entries())
			transaction.set(reference, {
				kind,
				attemptCount: next[index].attemptCount,
				windowStartedAt: next[index].windowStartedAt,
				updatedAt: now,
			});
	});
};

const parseDigestLookup = (
	value: FirebaseFirestore.DocumentData | undefined,
): {
	communityId: string;
	invitationId: string;
	expiresAt: Timestamp;
} => {
	if (
		!value ||
		value.invitationModelVersion !== 2 ||
		typeof value.communityId !== 'string' ||
		!identifierPattern.test(value.communityId) ||
		typeof value.invitationId !== 'string' ||
		!identifierPattern.test(value.invitationId) ||
		!(value.expiresAt instanceof Timestamp)
	)
		throw invitationUnavailable();
	return {
		communityId: value.communityId,
		invitationId: value.invitationId,
		expiresAt: value.expiresAt,
	};
};

const resolveInvitation = async (
	transaction: FirebaseFirestore.Transaction,
	database: FirebaseFirestore.Firestore,
	invitationDigest: string,
	now: Timestamp,
): Promise<IResolvedInvitation> => {
	const lookup = parseDigestLookup(
		(
			await transaction.get(
				database.doc(`communityInvitationDigests/${invitationDigest}`),
			)
		).data(),
	);
	if (lookup.expiresAt.toMillis() <= now.toMillis())
		throw invitationUnavailable();
	const communityReference = database.doc(
		`communities/${lookup.communityId}`,
	);
	const invitationReference = database.doc(
		`communities/${lookup.communityId}/invitations/${lookup.invitationId}`,
	);
	const [communitySnapshot, invitationSnapshot] = await Promise.all([
		transaction.get(communityReference),
		transaction.get(invitationReference),
	]);
	const community = communitySnapshot.data();
	if (
		!community ||
		community.lifecycle?.status !== 'Active' ||
		community.activeInvitationId !== lookup.invitationId ||
		typeof community.organizerUserId !== 'string' ||
		!identifierPattern.test(community.organizerUserId)
	)
		throw invitationUnavailable();
	let invitation: ICommunityInvitationDocument;
	try {
		invitation = parseStoredInvitation(
			invitationSnapshot.data(),
			lookup.communityId,
			lookup.invitationId,
		);
	} catch {
		throw invitationUnavailable();
	}
	if (
		invitation.tokenDigest !== invitationDigest ||
		invitation.lifecycle.status !== 'Active' ||
		timestampMilliseconds(invitation.expiresAt) <= now.toMillis() ||
		timestampMilliseconds(invitation.expiresAt) !==
			lookup.expiresAt.toMillis()
	)
		throw invitationUnavailable();
	const [organizerProfile, deletionTask] = await Promise.all([
		transaction.get(database.doc(`users/${community.organizerUserId}`)),
		transaction.get(
			database.doc(
				`communityAccountDeletionCleanup/${community.organizerUserId}`,
			),
		),
	]);
	if (!organizerProfile.exists || deletionTask.exists)
		throw invitationUnavailable();
	return {
		communityId: lookup.communityId,
		invitationId: lookup.invitationId,
		invitation,
		community,
		communityReference,
		organizerProfile,
	};
};

const communitySummary = (resolved: IResolvedInvitation): ICommunitySummary => {
	try {
		return parseCreateCommunityResult({
			community: {
				communityId: resolved.communityId,
				name: resolved.community.name,
				purpose: resolved.community.purpose,
				organizer: {
					userId: resolved.community.organizerUserId,
					displayName: resolveCommunityDisplayName(
						resolved.organizerProfile.data()?.preferredName,
					),
				},
				status: 'Active',
				...(resolved.community.settings?.participationExpectations ===
				undefined
					? {}
					: {
							participationExpectations:
								resolved.community.settings
									.participationExpectations,
						}),
			},
		}).community;
	} catch {
		throw dataUnavailable();
	}
};

export const previewCommunityInvitationForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IInvitationRedemptionDependencies,
): Promise<IPreviewCommunityInvitationResult> => {
	await consumeInvitationAttempt(userId, 'Preview', dependencies);
	const input = parseInput(parsePreviewCommunityInvitationRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const invitationDigest = digestCommunityInvitationCode(
		input.invitationCode,
	);
	return database.runTransaction(async (transaction) => {
		if (!(await transaction.get(database.doc(`users/${userId}`))).exists)
			throw invitationError(
				'failed-precondition',
				'Your account is unavailable. Please sign in again.',
				'AccountUnavailable',
			);
		const resolved = await resolveInvitation(
			transaction,
			database,
			invitationDigest,
			now,
		);
		const summary = communitySummary(resolved);
		const schedule = await readCurrentCommunityJourney(
			transaction,
			database,
			resolved.communityId,
			resolved.community,
			now,
		);
		return {
			preview: {
				communityName: summary.name,
				communityPurpose: summary.purpose,
				organizerDisplayName: summary.organizer.displayName,
				...(summary.participationExpectations === undefined
					? {}
					: {
							participationExpectations:
								summary.participationExpectations,
						}),
				expiresAt: resolved.invitation.expiresAt,
				...(schedule === null
					? {}
					: {
							coordinatedJourney: {
								course: schedule.course,
								startDate: schedule.startDate,
								timeZoneId: schedule.timeZoneId,
								status: schedule.status,
								canEnroll: schedule.canEnroll,
							},
						}),
			},
		};
	});
};

const requireProfileForAcceptance = (
	profile: FirebaseFirestore.DocumentSnapshot,
): FirebaseFirestore.DocumentData => {
	const data = profile.data();
	if (!data)
		throw invitationError(
			'failed-precondition',
			'Your account is unavailable. Please sign in again.',
			'AccountUnavailable',
		);
	if (
		data.schemaVersion !== 1 ||
		!Number.isInteger(data.revision) ||
		data.revision < 0 ||
		data.revision >= 2_147_483_647 ||
		!(data.createdAt instanceof Timestamp) ||
		!(data.updatedAt instanceof Timestamp)
	)
		throw dataUnavailable();
	return data;
};

const operationRequestMatches = (
	value: unknown,
	input: IAcceptCommunityInvitationRequest,
	invitationDigest: string,
): boolean => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		return false;
	const request = value as Record<string, unknown>;
	return (
		Object.keys(request).length === 2 &&
		request['invitationDigest'] === invitationDigest &&
		request['displayName'] === input.displayName
	);
};

const membershipRole = (
	resolved: IResolvedInvitation,
	userId: string,
): 'Organizer' | 'Member' =>
	resolved.community.organizerUserId === userId ? 'Organizer' : 'Member';

export const acceptCommunityInvitationForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IInvitationRedemptionDependencies,
): Promise<IAcceptCommunityInvitationResult> => {
	await consumeInvitationAttempt(userId, 'Accept', dependencies);
	const input = parseInput(parseAcceptCommunityInvitationRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const invitationDigest = digestCommunityInvitationCode(
		input.invitationCode,
	);
	return database.runTransaction(async (transaction) => {
		const profileReference = database.doc(`users/${userId}`);
		const profileSnapshot = await transaction.get(profileReference);
		const profile = requireProfileForAcceptance(profileSnapshot);
		const resolved = await resolveInvitation(
			transaction,
			database,
			invitationDigest,
			now,
		);
		const membershipReference = resolved.communityReference
			.collection('members')
			.doc(userId);
		const indexReference = database.doc(
			`users/${userId}/communityMemberships/${resolved.communityId}`,
		);
		const redemptionReference = database.doc(
			`communities/${resolved.communityId}/invitations/${resolved.invitationId}/redemptions/${userId}`,
		);
		const operationReference = database.doc(
			`users/${userId}/communityInvitationAcceptOperations/${input.operationId}`,
		);
		const [membershipSnapshot, redemptionSnapshot, operationSnapshot] =
			await Promise.all([
				transaction.get(membershipReference),
				transaction.get(redemptionReference),
				transaction.get(operationReference),
			]);
		const existingMembership = membershipSnapshot.data();
		if (existingMembership?.lifecycle?.status === 'Removed')
			throw invitationError(
				'permission-denied',
				'This account cannot rejoin this community with an invitation.',
				'MembershipRemoved',
			);
		if (existingMembership?.lifecycle?.status === 'Leaving')
			throw invitationError(
				'failed-precondition',
				'Your membership change must finish before you can rejoin.',
				'MembershipUnavailable',
			);
		const previousOperation = operationSnapshot.data();
		if (previousOperation) {
			if (
				!operationRequestMatches(
					previousOperation.request,
					input,
					invitationDigest,
				)
			)
				throw invitationError(
					'already-exists',
					'This operation ID was already used for another invitation request.',
					'OperationPayloadMismatch',
				);
			if (
				existingMembership?.lifecycle?.status !== 'Active' ||
				!['Accepted', 'AlreadyMember', 'Rejoined'].includes(
					String(previousOperation.outcome),
				)
			)
				throw invitationError(
					'failed-precondition',
					'This membership is no longer active.',
					'MembershipUnavailable',
				);
			const summary = communitySummary(resolved);
			return {
				outcome:
					previousOperation.outcome as TCommunityInvitationAcceptanceOutcome,
				community: summary,
				membership: {
					communityId: resolved.communityId,
					userId,
					displayName: resolveCommunityDisplayName(
						profile.preferredName,
					),
					role: membershipRole(resolved, userId),
				},
			};
		}

		let outcome: TCommunityInvitationAcceptanceOutcome;
		let joinedAt: Timestamp;
		let createdAt: Timestamp;
		if (existingMembership?.lifecycle?.status === 'Active') {
			if (
				existingMembership.communityId !== resolved.communityId ||
				existingMembership.userId !== userId ||
				!(existingMembership.joinedAt instanceof Timestamp) ||
				!(existingMembership.createdAt instanceof Timestamp)
			)
				throw dataUnavailable();
			outcome = 'AlreadyMember';
			joinedAt = existingMembership.joinedAt;
			createdAt = existingMembership.createdAt;
		} else if (existingMembership?.lifecycle?.status === 'Left') {
			if (!(existingMembership.createdAt instanceof Timestamp))
				throw dataUnavailable();
			outcome = 'Rejoined';
			joinedAt = now;
			createdAt = existingMembership.createdAt;
		} else if (existingMembership) {
			throw dataUnavailable();
		} else {
			outcome = 'Accepted';
			joinedAt = now;
			createdAt = now;
		}
		const membership: ICommunityMembershipDocument = {
			schemaVersion: 1,
			communityId: resolved.communityId,
			userId,
			role: membershipRole(resolved, userId),
			joinedAt,
			lifecycle: { status: 'Active' },
			createdAt,
			updatedAt: now,
		};
		transaction.set(membershipReference, membership);
		transaction.set(indexReference, membership);
		if (!redemptionSnapshot.exists)
			transaction.create(redemptionReference, {
				schemaVersion: 1,
				communityId: resolved.communityId,
				invitationId: resolved.invitationId,
				memberUserId: userId,
				redeemedAt: now,
			});
		else {
			const redemption = redemptionSnapshot.data();
			if (
				redemption?.communityId !== resolved.communityId ||
				redemption?.invitationId !== resolved.invitationId ||
				redemption?.memberUserId !== userId ||
				!(redemption?.redeemedAt instanceof Timestamp)
			)
				throw dataUnavailable();
		}
		if (profile.preferredName !== input.displayName)
			transaction.update(profileReference, {
				preferredName: input.displayName,
				revision: profile.revision + 1,
				updatedAt: now,
			});
		transaction.create(operationReference, {
			request: { invitationDigest, displayName: input.displayName },
			communityId: resolved.communityId,
			invitationId: resolved.invitationId,
			outcome,
			createdAt: now,
		});
		const summary = communitySummary(resolved);
		return {
			outcome,
			community: summary,
			membership: {
				communityId: resolved.communityId,
				userId,
				displayName: input.displayName,
				role: membership.role,
			},
		};
	});
};

export const previewCommunityInvitation = onCall(async (request) =>
	previewCommunityInvitationForAccount(
		requireCommunityAccount(request.auth),
		request.data,
		{ requestScopeDigest: deriveCommunityInvitationRequestScope(request) },
	),
);

export const acceptCommunityInvitation = onCall(async (request) =>
	acceptCommunityInvitationForAccount(
		requireCommunityAccount(request.auth),
		request.data,
		{ requestScopeDigest: deriveCommunityInvitationRequestScope(request) },
	),
);
