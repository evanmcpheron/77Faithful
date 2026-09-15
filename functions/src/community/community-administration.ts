import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
	parseCloseCommunityRequest,
	parseLeaveCommunityRequest,
	parseRemoveCommunityMemberRequest,
	parseTransferCommunityOrganizerRequest,
	parseUpdateCommunityRequest,
} from '../../generated/features/communities/community-administration';
import type {
	ICloseCommunityRequest,
	ICloseCommunityResult,
	ILeaveCommunityRequest,
	ILeaveCommunityResult,
	IRemoveCommunityMemberRequest,
	IRemoveCommunityMemberResult,
	ITransferCommunityOrganizerRequest,
	ITransferCommunityOrganizerResult,
	IUpdateCommunityRequest,
	IUpdateCommunityResult,
	TCommunityAdministrationReasonCode,
} from '../../generated/types/community/community-function.types';
import type {
	ICommunityMemberRemovalDocument,
	ICommunityMembershipDocument,
} from '../../generated/types/community/community-membership.types';
import type { ICommunitySummary } from '../../generated/types/community/community.types';
import { onCall } from './community-callable';
import { queueCommunityExitCleanup } from './community-cleanup';
import { resolveCommunityDisplayName } from './read-community';

interface IAdministrationDependencies {
	database?: FirebaseFirestore.Firestore;
	now?: Timestamp;
}

interface IAuthorizedCommunity {
	reference: FirebaseFirestore.DocumentReference;
	data: FirebaseFirestore.DocumentData;
	membershipReference: FirebaseFirestore.DocumentReference;
	membership: ICommunityMembershipDocument;
	profile: FirebaseFirestore.DocumentSnapshot;
}

interface IActiveInvitationRecord {
	reference: FirebaseFirestore.DocumentReference;
	data: FirebaseFirestore.DocumentData;
}

type TAdministrationRequest =
	| IUpdateCommunityRequest
	| ILeaveCommunityRequest
	| IRemoveCommunityMemberRequest
	| ITransferCommunityOrganizerRequest
	| ICloseCommunityRequest;

const identifierPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const digestPattern = /^[a-f0-9]{64}$/;

const timestampMilliseconds = (value: {
	seconds: number;
	nanoseconds: number;
}): number => value.seconds * 1000 + value.nanoseconds / 1_000_000;

const administrationError = (
	code: ConstructorParameters<typeof HttpsError>[0],
	message: string,
	reason: TCommunityAdministrationReasonCode,
): HttpsError => new HttpsError(code, message, { reason });

const dataUnavailable = (): HttpsError =>
	administrationError(
		'internal',
		'This community administration request could not be completed.',
		'AdministrationDataUnavailable',
	);

const requireAdministrationAccount = (
	auth: CallableRequest['auth'],
): string => {
	if (!auth)
		throw administrationError(
			'unauthenticated',
			'Sign in to manage this community.',
			'AuthenticationRequired',
		);
	if (auth.token.email_verified !== true)
		throw administrationError(
			'permission-denied',
			'Confirm your email to manage this community.',
			'EmailVerificationRequired',
		);
	return auth.uid;
};

const parseInput = <T>(parser: (value: unknown) => T, value: unknown): T => {
	try {
		return parser(value);
	} catch {
		throw administrationError(
			'invalid-argument',
			'Choose valid community administration details.',
			'InvalidInput',
		);
	}
};

const requireRevision = (community: FirebaseFirestore.DocumentData): number => {
	const revision: unknown = community.revision;
	if (
		typeof revision !== 'number' ||
		!Number.isInteger(revision) ||
		revision < 0 ||
		revision >= 2_147_483_647
	)
		throw dataUnavailable();
	return revision;
};

const parseMembership = (
	value: FirebaseFirestore.DocumentData | undefined,
	communityId: string,
	userId: string,
): ICommunityMembershipDocument => {
	if (
		!value ||
		value.schemaVersion !== 1 ||
		value.communityId !== communityId ||
		value.userId !== userId ||
		(value.role !== 'Organizer' && value.role !== 'Member') ||
		!value.lifecycle ||
		!['Active', 'Leaving', 'Left', 'Removed'].includes(
			value.lifecycle.status,
		) ||
		!(value.joinedAt instanceof Timestamp) ||
		!(value.createdAt instanceof Timestamp) ||
		!(value.updatedAt instanceof Timestamp)
	)
		throw dataUnavailable();
	if (
		(value.lifecycle.status === 'Leaving' &&
			!(value.lifecycle.leaveRequestedAt instanceof Timestamp)) ||
		(value.lifecycle.status === 'Left' &&
			!(value.lifecycle.leftAt instanceof Timestamp)) ||
		(value.lifecycle.status === 'Removed' &&
			!(value.lifecycle.removedAt instanceof Timestamp))
	)
		throw dataUnavailable();
	return {
		schemaVersion: 1,
		communityId,
		userId,
		role: value.role,
		joinedAt: value.joinedAt,
		lifecycle:
			value.lifecycle.status === 'Leaving'
				? {
						status: 'Leaving',
						leaveRequestedAt: value.lifecycle.leaveRequestedAt,
					}
				: value.lifecycle.status === 'Left'
					? { status: 'Left', leftAt: value.lifecycle.leftAt }
					: value.lifecycle.status === 'Removed'
						? {
								status: 'Removed',
								removedAt: value.lifecycle.removedAt,
							}
						: { status: 'Active' },
		createdAt: value.createdAt,
		updatedAt: value.updatedAt,
	};
};

const getCommunityForMember = async (
	transaction: FirebaseFirestore.Transaction,
	database: FirebaseFirestore.Firestore,
	userId: string,
	communityId: string,
): Promise<IAuthorizedCommunity> => {
	const profileReference = database.doc(`users/${userId}`);
	const communityReference = database.doc(`communities/${communityId}`);
	const membershipReference = communityReference
		.collection('members')
		.doc(userId);
	const [profile, community, membership] = await Promise.all([
		transaction.get(profileReference),
		transaction.get(communityReference),
		transaction.get(membershipReference),
	]);
	if (!profile.exists)
		throw administrationError(
			'failed-precondition',
			'Your account is unavailable. Please sign in again.',
			'AccountUnavailable',
		);
	if (!community.exists)
		throw administrationError(
			'not-found',
			'This community is unavailable.',
			'CommunityUnavailable',
		);
	const communityData = community.data();
	if (
		!communityData ||
		!communityData.lifecycle ||
		!['Active', 'Closed'].includes(communityData.lifecycle.status) ||
		typeof communityData.organizerUserId !== 'string' ||
		!identifierPattern.test(communityData.organizerUserId)
	)
		throw dataUnavailable();
	return {
		reference: communityReference,
		data: communityData,
		membershipReference,
		membership: parseMembership(membership.data(), communityId, userId),
		profile,
	};
};

const requireActiveOrganizer = (
	authorized: IAuthorizedCommunity,
	userId: string,
): void => {
	if (authorized.data.lifecycle.status === 'Closed')
		throw administrationError(
			'failed-precondition',
			'This community is closed.',
			'CommunityClosed',
		);
	if (authorized.data.lifecycle.status !== 'Active') throw dataUnavailable();
	if (
		authorized.data.organizerUserId !== userId ||
		authorized.membership.role !== 'Organizer' ||
		authorized.membership.lifecycle.status !== 'Active'
	)
		throw administrationError(
			'permission-denied',
			'Only the current community organizer can do this.',
			'OrganizerRequired',
		);
};

const requireOrganizerIncludingClosed = (
	authorized: IAuthorizedCommunity,
	userId: string,
): void => {
	if (
		authorized.data.organizerUserId !== userId ||
		authorized.membership.role !== 'Organizer' ||
		authorized.membership.lifecycle.status !== 'Active'
	)
		throw administrationError(
			'permission-denied',
			'Only the current community organizer can do this.',
			'OrganizerRequired',
		);
};

const summary = (
	communityId: string,
	community: FirebaseFirestore.DocumentData,
	organizerUserId: string,
	organizerProfile: FirebaseFirestore.DocumentSnapshot,
	status: 'Active' | 'Closed' = 'Active',
): ICommunitySummary => {
	if (
		typeof community.name !== 'string' ||
		typeof community.purpose !== 'string' ||
		!community.settings ||
		typeof community.settings !== 'object'
	)
		throw dataUnavailable();
	const expectations: unknown = community.settings.participationExpectations;
	if (expectations !== undefined && typeof expectations !== 'string')
		throw dataUnavailable();
	return {
		communityId,
		name: community.name,
		purpose: community.purpose,
		organizer: {
			userId: organizerUserId,
			displayName: resolveCommunityDisplayName(
				organizerProfile.data()?.preferredName,
			),
		},
		status,
		...(expectations === undefined
			? {}
			: { participationExpectations: expectations }),
	};
};

const operationReference = (
	database: FirebaseFirestore.Firestore,
	userId: string,
	kind: 'Update' | 'Leave' | 'RemoveMember' | 'TransferOrganizer' | 'Close',
	operationId: string,
): FirebaseFirestore.DocumentReference =>
	database.doc(`users/${userId}/community${kind}Operations/${operationId}`);

const operationRequest = (
	input: TAdministrationRequest,
): Record<string, unknown> => {
	const request = { ...input } as Record<string, unknown>;
	delete request['operationId'];
	if (typeof request['privateReason'] === 'string') {
		request['privateReasonDigest'] = createHash('sha256')
			.update(request['privateReason'], 'utf8')
			.digest('hex');
		delete request['privateReason'];
	}
	return request;
};

const assertOperationRequest = (
	receipt: FirebaseFirestore.DocumentSnapshot,
	input: TAdministrationRequest,
): FirebaseFirestore.DocumentData | null => {
	if (!receipt.exists) return null;
	const data = receipt.data();
	if (
		!data ||
		JSON.stringify(data.request) !== JSON.stringify(operationRequest(input))
	)
		throw administrationError(
			'already-exists',
			'This operation ID was already used for different details.',
			'OperationPayloadMismatch',
		);
	return data;
};

const requireExpectedRevision = (
	community: FirebaseFirestore.DocumentData,
	expectedRevision: number,
): number => {
	const revision = requireRevision(community);
	if (revision !== expectedRevision)
		throw administrationError(
			'aborted',
			'This community changed. Review it and try again.',
			'RevisionConflict',
		);
	return revision;
};

const activeMembershipWithRole = (
	membership: ICommunityMembershipDocument,
	role: 'Organizer' | 'Member',
	now: Timestamp,
): ICommunityMembershipDocument => ({
	...membership,
	role,
	lifecycle: { status: 'Active' },
	updatedAt: now,
});

const writeMembershipAndIndex = (
	transaction: FirebaseFirestore.Transaction,
	database: FirebaseFirestore.Firestore,
	membershipReference: FirebaseFirestore.DocumentReference,
	membership: ICommunityMembershipDocument,
): void => {
	transaction.set(membershipReference, membership);
	transaction.set(
		database.doc(
			`users/${membership.userId}/communityMemberships/${membership.communityId}`,
		),
		membership,
	);
};

export const updateCommunityForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IAdministrationDependencies = {},
): Promise<IUpdateCommunityResult> => {
	const input = parseInput(parseUpdateCommunityRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const receiptReference = operationReference(
		database,
		userId,
		'Update',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const authorized = await getCommunityForMember(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireActiveOrganizer(authorized, userId);
		const receipt = await transaction.get(receiptReference);
		const previous = assertOperationRequest(receipt, input);
		if (previous) {
			if (!previous.resultCommunity) throw dataUnavailable();
			return { community: previous.resultCommunity as ICommunitySummary };
		}
		const revision = requireExpectedRevision(
			authorized.data,
			input.expectedRevision,
		);
		const nextCommunity = {
			...authorized.data,
			name: input.name,
			purpose: input.purpose,
			settings: input.settings,
			revision: revision + 1,
			updatedAt: now,
		};
		const result = summary(
			input.communityId,
			nextCommunity,
			userId,
			authorized.profile,
		);
		transaction.update(authorized.reference, {
			name: input.name,
			purpose: input.purpose,
			settings: input.settings,
			revision: revision + 1,
			updatedAt: now,
		});
		transaction.create(receiptReference, {
			request: operationRequest(input),
			resultCommunity: result,
			createdAt: now,
		});
		return { community: result };
	});
};

export const leaveCommunityForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IAdministrationDependencies = {},
): Promise<ILeaveCommunityResult> => {
	const input = parseInput(parseLeaveCommunityRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const receiptReference = operationReference(
		database,
		userId,
		'Leave',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const authorized = await getCommunityForMember(
			transaction,
			database,
			userId,
			input.communityId,
		);
		const receipt = await transaction.get(receiptReference);
		const previous = assertOperationRequest(receipt, input);
		if (previous) {
			if (
				!(previous.leftAt instanceof Timestamp) ||
				authorized.membership.lifecycle.status !== 'Left' ||
				timestampMilliseconds(
					authorized.membership.lifecycle.leftAt,
				) !== previous.leftAt.toMillis()
			)
				throw dataUnavailable();
			return { communityId: input.communityId, leftAt: previous.leftAt };
		}
		if (authorized.membership.lifecycle.status !== 'Active')
			throw administrationError(
				'failed-precondition',
				'This membership is unavailable.',
				'MemberUnavailable',
			);
		if (
			authorized.data.lifecycle.status === 'Active' &&
			authorized.data.organizerUserId === userId &&
			authorized.membership.role === 'Organizer'
		)
			throw administrationError(
				'failed-precondition',
				'Transfer the organizer role or close the community before leaving.',
				'OrganizerTransferRequired',
			);
		const membership: ICommunityMembershipDocument = {
			...authorized.membership,
			role: 'Member',
			lifecycle: { status: 'Left', leftAt: now },
			updatedAt: now,
		};
		writeMembershipAndIndex(
			transaction,
			database,
			authorized.membershipReference,
			membership,
		);
		queueCommunityExitCleanup(
			transaction,
			database,
			input.communityId,
			userId,
			now,
		);
		transaction.create(receiptReference, {
			request: operationRequest(input),
			leftAt: now,
			createdAt: now,
		});
		return { communityId: input.communityId, leftAt: now };
	});
};

export const removeCommunityMemberForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IAdministrationDependencies = {},
): Promise<IRemoveCommunityMemberResult> => {
	const input = parseInput(parseRemoveCommunityMemberRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const receiptReference = operationReference(
		database,
		userId,
		'RemoveMember',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const authorized = await getCommunityForMember(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireActiveOrganizer(authorized, userId);
		const targetReference = database.doc(
			`communities/${input.communityId}/members/${input.memberUserId}`,
		);
		const [receipt, targetSnapshot] = await Promise.all([
			transaction.get(receiptReference),
			transaction.get(targetReference),
		]);
		if (!targetSnapshot.exists)
			throw administrationError(
				'not-found',
				'This community member is unavailable.',
				'MemberUnavailable',
			);
		const target = parseMembership(
			targetSnapshot.data(),
			input.communityId,
			input.memberUserId,
		);
		const previous = assertOperationRequest(receipt, input);
		if (previous) {
			if (
				!(previous.removedAt instanceof Timestamp) ||
				target.lifecycle.status !== 'Removed' ||
				timestampMilliseconds(target.lifecycle.removedAt) !==
					previous.removedAt.toMillis()
			)
				throw dataUnavailable();
			return {
				communityId: input.communityId,
				memberUserId: input.memberUserId,
				removedAt: previous.removedAt,
			};
		}
		if (
			input.memberUserId === authorized.data.organizerUserId ||
			target.role === 'Organizer'
		)
			throw administrationError(
				'failed-precondition',
				'Transfer the organizer role before removing this member.',
				'OrganizerTransferRequired',
			);
		if (target.lifecycle.status !== 'Active')
			throw administrationError(
				'failed-precondition',
				'This membership is unavailable.',
				'MemberUnavailable',
			);
		const membership: ICommunityMembershipDocument = {
			...target,
			role: 'Member',
			lifecycle: { status: 'Removed', removedAt: now },
			updatedAt: now,
		};
		writeMembershipAndIndex(
			transaction,
			database,
			targetReference,
			membership,
		);
		queueCommunityExitCleanup(
			transaction,
			database,
			input.communityId,
			input.memberUserId,
			now,
		);
		const removal: ICommunityMemberRemovalDocument = {
			schemaVersion: 1,
			communityId: input.communityId,
			memberUserId: input.memberUserId,
			removedByUserId: userId,
			privateReason: input.privateReason,
			removedAt: now,
			createdAt: now,
			updatedAt: now,
		};
		transaction.create(
			database.doc(
				`communities/${input.communityId}/memberRemovals/${input.memberUserId}`,
			),
			removal,
		);
		transaction.create(receiptReference, {
			request: operationRequest(input),
			removedAt: now,
			createdAt: now,
		});
		return {
			communityId: input.communityId,
			memberUserId: input.memberUserId,
			removedAt: now,
		};
	});
};

export const transferCommunityOrganizerForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IAdministrationDependencies = {},
): Promise<ITransferCommunityOrganizerResult> => {
	const input = parseInput(parseTransferCommunityOrganizerRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const receiptReference = operationReference(
		database,
		userId,
		'TransferOrganizer',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const authorized = await getCommunityForMember(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireActiveOrganizer(authorized, userId);
		if (input.nextOrganizerUserId === userId)
			throw administrationError(
				'invalid-argument',
				'Choose another active member as organizer.',
				'InvalidInput',
			);
		const nextMembershipReference = database.doc(
			`communities/${input.communityId}/members/${input.nextOrganizerUserId}`,
		);
		const [receipt, nextMembershipSnapshot, nextProfile] =
			await Promise.all([
				transaction.get(receiptReference),
				transaction.get(nextMembershipReference),
				transaction.get(
					database.doc(`users/${input.nextOrganizerUserId}`),
				),
			]);
		const previous = assertOperationRequest(receipt, input);
		if (previous)
			throw administrationError(
				'permission-denied',
				'The organizer role has already changed.',
				'OrganizerRequired',
			);
		if (!nextMembershipSnapshot.exists || !nextProfile.exists)
			throw administrationError(
				'failed-precondition',
				'Choose an active community member as organizer.',
				'MemberUnavailable',
			);
		const nextMembership = parseMembership(
			nextMembershipSnapshot.data(),
			input.communityId,
			input.nextOrganizerUserId,
		);
		if (
			nextMembership.lifecycle.status !== 'Active' ||
			nextMembership.role !== 'Member'
		)
			throw administrationError(
				'failed-precondition',
				'Choose an active community member as organizer.',
				'MemberUnavailable',
			);
		const revision = requireExpectedRevision(
			authorized.data,
			input.expectedRevision,
		);
		const oldOrganizerMembership = activeMembershipWithRole(
			authorized.membership,
			'Member',
			now,
		);
		const newOrganizerMembership = activeMembershipWithRole(
			nextMembership,
			'Organizer',
			now,
		);
		writeMembershipAndIndex(
			transaction,
			database,
			authorized.membershipReference,
			oldOrganizerMembership,
		);
		writeMembershipAndIndex(
			transaction,
			database,
			nextMembershipReference,
			newOrganizerMembership,
		);
		transaction.update(authorized.reference, {
			organizerUserId: input.nextOrganizerUserId,
			revision: revision + 1,
			updatedAt: now,
		});
		const result = summary(
			input.communityId,
			authorized.data,
			input.nextOrganizerUserId,
			nextProfile,
		);
		transaction.create(receiptReference, {
			request: operationRequest(input),
			resultCommunity: result,
			createdAt: now,
		});
		return { community: result };
	});
};

export const closeCommunityForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IAdministrationDependencies = {},
): Promise<ICloseCommunityResult> => {
	const input = parseInput(parseCloseCommunityRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const receiptReference = operationReference(
		database,
		userId,
		'Close',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const authorized = await getCommunityForMember(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireOrganizerIncludingClosed(authorized, userId);
		const receipt = await transaction.get(receiptReference);
		const previous = assertOperationRequest(receipt, input);
		if (previous) {
			if (
				authorized.data.lifecycle.status !== 'Closed' ||
				!(previous.closedAt instanceof Timestamp)
			)
				throw dataUnavailable();
			return {
				communityId: input.communityId,
				closedAt: previous.closedAt,
			};
		}
		if (authorized.data.lifecycle.status === 'Closed')
			throw administrationError(
				'failed-precondition',
				'This community is closed.',
				'CommunityClosed',
			);
		if (authorized.data.lifecycle.status !== 'Active')
			throw dataUnavailable();
		const revision = requireExpectedRevision(
			authorized.data,
			input.expectedRevision,
		);
		const activeInvitationId: unknown = authorized.data.activeInvitationId;
		if (
			activeInvitationId !== null &&
			activeInvitationId !== undefined &&
			(typeof activeInvitationId !== 'string' ||
				!identifierPattern.test(activeInvitationId))
		)
			throw dataUnavailable();
		let invitation: IActiveInvitationRecord | undefined;
		if (activeInvitationId) {
			const reference = database.doc(
				`communities/${input.communityId}/invitations/${activeInvitationId}`,
			);
			const snapshot = await transaction.get(reference);
			const data = snapshot.data();
			if (data) invitation = { reference, data };
		}
		if (invitation) {
			if (invitation.data.lifecycle?.status === 'Active')
				transaction.update(invitation.reference, {
					lifecycle: { status: 'Revoked', revokedAt: now },
					updatedAt: now,
				});
			if (digestPattern.test(String(invitation.data.tokenDigest)))
				transaction.delete(
					database.doc(
						`communityInvitationDigests/${invitation.data.tokenDigest}`,
					),
				);
		}
		transaction.update(authorized.reference, {
			lifecycle: { status: 'Closed', closedAt: now },
			activeInvitationId: null,
			revision: revision + 1,
			updatedAt: now,
		});
		transaction.create(receiptReference, {
			request: operationRequest(input),
			closedAt: now,
			createdAt: now,
		});
		return { communityId: input.communityId, closedAt: now };
	});
};

export const updateCommunity = onCall(async (request) =>
	updateCommunityForAccount(
		requireAdministrationAccount(request.auth),
		request.data,
	),
);

export const leaveCommunity = onCall(async (request) =>
	leaveCommunityForAccount(
		requireAdministrationAccount(request.auth),
		request.data,
	),
);

export const removeCommunityMember = onCall(async (request) =>
	removeCommunityMemberForAccount(
		requireAdministrationAccount(request.auth),
		request.data,
	),
);

export const transferCommunityOrganizer = onCall(async (request) =>
	transferCommunityOrganizerForAccount(
		requireAdministrationAccount(request.auth),
		request.data,
	),
);

export const closeCommunity = onCall(async (request) =>
	closeCommunityForAccount(
		requireAdministrationAccount(request.auth),
		request.data,
	),
);
