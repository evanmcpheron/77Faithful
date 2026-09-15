import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import {
	normalizeCommunityInvitationCode,
	parseGetCurrentCommunityInvitationRequest,
	parseIssueCommunityInvitationRequest,
	parseRevokeCommunityInvitationRequest,
	parseRotateCommunityInvitationRequest,
} from '../../generated/features/communities/community-invitation';
import type {
	IGetCurrentCommunityInvitationResult,
	IIssueCommunityInvitationRequest,
	IIssueCommunityInvitationResult,
	IRevokeCommunityInvitationRequest,
	IRevokeCommunityInvitationResult,
	IRotateCommunityInvitationRequest,
	IRotateCommunityInvitationResult,
	TCommunityInvitationReasonCode,
} from '../../generated/types/community/community-function.types';
import type {
	ICommunityInvitationDigestLookupDocument,
	ICommunityInvitationDocument,
	IEncryptedCommunityInvitationCode,
	IOrganizerCommunityInvitation,
} from '../../generated/types/community/community-invitation.types';
import { onCall } from './community-callable';
import {
	decryptCommunityInvitationCode,
	digestCommunityInvitationCode,
	encryptCommunityInvitationCode,
	generateCommunityInvitationCode,
	parseCommunityInvitationEncryptionConfiguration,
	type TCommunityInvitationEncryptionConfiguration,
} from './community-invitation-crypto';

export const COMMUNITY_INVITATION_ENCRYPTION_KEYS_SECRET_NAME =
	'COMMUNITY_INVITATION_ENCRYPTION_KEYS';
export const communityInvitationEncryptionKeys = defineSecret(
	COMMUNITY_INVITATION_ENCRYPTION_KEYS_SECRET_NAME,
);

const INVITATION_LIFETIME_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;
const identifierPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const digestPattern = /^[a-f0-9]{64}$/;

interface IInvitationDependencies {
	database?: FirebaseFirestore.Firestore;
	now?: Timestamp;
	encryptionConfiguration: TCommunityInvitationEncryptionConfiguration;
}

interface IRevokeDependencies {
	database?: FirebaseFirestore.Firestore;
	now?: Timestamp;
}

type TInvitationMutationRequest =
	IIssueCommunityInvitationRequest | IRotateCommunityInvitationRequest;

interface IAuthorizedCommunity {
	reference: FirebaseFirestore.DocumentReference;
	data: FirebaseFirestore.DocumentData;
	activeInvitationId: string | null;
}

interface IInvitationCandidate {
	code: string;
	document: ICommunityInvitationDocument;
	reference: FirebaseFirestore.DocumentReference;
	lookup: ICommunityInvitationDigestLookupDocument;
	lookupReference: FirebaseFirestore.DocumentReference;
}

const reasonDetails = (reason: TCommunityInvitationReasonCode) => ({ reason });

const invitationError = (
	code: ConstructorParameters<typeof HttpsError>[0],
	message: string,
	reason: TCommunityInvitationReasonCode,
): HttpsError => new HttpsError(code, message, reasonDetails(reason));

const dataUnavailable = (): HttpsError =>
	invitationError(
		'internal',
		'This community invitation could not be loaded.',
		'InvitationDataUnavailable',
	);

const invitationUnavailable = (): HttpsError =>
	invitationError(
		'failed-precondition',
		'This community invitation is no longer available.',
		'InvitationUnavailable',
	);

const requireInvitationAccount = (auth: CallableRequest['auth']): string => {
	if (!auth)
		throw invitationError(
			'unauthenticated',
			'Sign in to manage community invitations.',
			'AuthenticationRequired',
		);
	if (auth.token.email_verified !== true)
		throw invitationError(
			'permission-denied',
			'Confirm your email to manage community invitations.',
			'EmailVerificationRequired',
		);
	return auth.uid;
};

const parseCallableInput = <T>(
	parser: (value: unknown) => T,
	value: unknown,
): T => {
	try {
		return parser(value);
	} catch {
		throw invitationError(
			'invalid-argument',
			'Choose a valid community invitation request.',
			'InvalidInput',
		);
	}
};

const isIdentifier = (value: unknown): value is string =>
	typeof value === 'string' && identifierPattern.test(value);

const requireAuthorizedCommunity = async (
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
		throw invitationError(
			'failed-precondition',
			'Your account is unavailable. Please sign in again.',
			'AccountUnavailable',
		);
	if (!community.exists)
		throw invitationError(
			'not-found',
			'This community is unavailable.',
			'CommunityUnavailable',
		);
	const communityData = community.data();
	const membershipData = membership.data();
	if (!communityData) throw dataUnavailable();
	if (communityData.lifecycle?.status === 'Closed')
		throw invitationError(
			'failed-precondition',
			'Closed communities cannot use invitations.',
			'CommunityClosed',
		);
	if (communityData.lifecycle?.status !== 'Active') throw dataUnavailable();
	if (
		communityData.organizerUserId !== userId ||
		!membership.exists ||
		membershipData?.communityId !== communityId ||
		membershipData?.userId !== userId ||
		membershipData?.role !== 'Organizer' ||
		membershipData?.lifecycle?.status !== 'Active'
	)
		throw invitationError(
			'permission-denied',
			'Only the current community organizer can manage invitations.',
			'OrganizerRequired',
		);
	if (
		!Object.prototype.hasOwnProperty.call(
			communityData,
			'activeInvitationId',
		)
	)
		throw invitationError(
			'failed-precondition',
			'This community requires invitation migration before invitations can be managed.',
			'InvitationMigrationRequired',
		);
	const activeInvitationId: unknown = communityData.activeInvitationId;
	if (activeInvitationId !== null && !isIdentifier(activeInvitationId))
		throw dataUnavailable();
	return {
		reference: communityReference,
		data: communityData,
		activeInvitationId,
	};
};

const parseEncryptedCode = (
	value: unknown,
): IEncryptedCommunityInvitationCode => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw dataUnavailable();
	const encrypted = value as Record<string, unknown>;
	if (
		Object.keys(encrypted).length !== 5 ||
		encrypted['algorithm'] !== 'Aes256Gcm' ||
		typeof encrypted['keyVersion'] !== 'string' ||
		typeof encrypted['nonce'] !== 'string' ||
		typeof encrypted['ciphertext'] !== 'string' ||
		typeof encrypted['authenticationTag'] !== 'string'
	)
		throw dataUnavailable();
	return {
		algorithm: 'Aes256Gcm',
		keyVersion: encrypted['keyVersion'],
		nonce: encrypted['nonce'],
		ciphertext: encrypted['ciphertext'],
		authenticationTag: encrypted['authenticationTag'],
	};
};

export const parseStoredInvitation = (
	value: FirebaseFirestore.DocumentData | undefined,
	communityId: string,
	invitationId: string,
): ICommunityInvitationDocument => {
	if (
		!value ||
		value.schemaVersion !== 1 ||
		value.invitationModelVersion !== 2 ||
		value.communityId !== communityId ||
		value.invitationId !== invitationId ||
		!isIdentifier(value.createdByUserId) ||
		!(value.createdAt instanceof Timestamp) ||
		!(value.updatedAt instanceof Timestamp) ||
		!(value.expiresAt instanceof Timestamp) ||
		!digestPattern.test(String(value.tokenDigest)) ||
		!value.lifecycle ||
		!['Active', 'Revoked', 'Expired'].includes(value.lifecycle.status)
	)
		throw dataUnavailable();
	if (
		(value.lifecycle.status === 'Revoked' &&
			!(value.lifecycle.revokedAt instanceof Timestamp)) ||
		(value.lifecycle.status !== 'Revoked' &&
			Object.keys(value.lifecycle).length !== 1)
	)
		throw dataUnavailable();
	return {
		schemaVersion: 1,
		invitationModelVersion: 2,
		invitationId,
		communityId,
		createdByUserId: value.createdByUserId,
		expiresAt: value.expiresAt,
		lifecycle:
			value.lifecycle.status === 'Revoked'
				? { status: 'Revoked', revokedAt: value.lifecycle.revokedAt }
				: value.lifecycle.status === 'Expired'
					? { status: 'Expired' }
					: { status: 'Active' },
		tokenDigest: value.tokenDigest,
		encryptedCode: parseEncryptedCode(value.encryptedCode),
		createdAt: value.createdAt,
		updatedAt: value.updatedAt,
	};
};

const serializeTimestamp = (timestamp: {
	seconds: number;
	nanoseconds: number;
}): { seconds: number; nanoseconds: number } => ({
	seconds: timestamp.seconds,
	nanoseconds: timestamp.nanoseconds,
});

const decryptInvitation = (
	document: ICommunityInvitationDocument,
	configuration: TCommunityInvitationEncryptionConfiguration,
): IOrganizerCommunityInvitation => {
	const code = decryptCommunityInvitationCode(
		document.encryptedCode,
		document.communityId,
		document.invitationId,
		configuration,
	);
	let normalized: string;
	try {
		normalized = normalizeCommunityInvitationCode(code);
	} catch {
		throw dataUnavailable();
	}
	if (digestCommunityInvitationCode(normalized) !== document.tokenDigest)
		throw dataUnavailable();
	const canonicalCode = `${normalized.slice(0, 5)}-${normalized.slice(5, 10)}-${normalized.slice(10, 15)}-${normalized.slice(15)}`;
	if (code !== canonicalCode) throw dataUnavailable();
	return {
		communityId: document.communityId,
		invitationId: document.invitationId,
		code,
		expiresAt: serializeTimestamp(document.expiresAt),
	};
};

const readInvitation = async (
	transaction: FirebaseFirestore.Transaction,
	database: FirebaseFirestore.Firestore,
	communityId: string,
	invitationId: string,
): Promise<{
	document: ICommunityInvitationDocument;
	reference: FirebaseFirestore.DocumentReference;
}> => {
	const reference = database.doc(
		`communities/${communityId}/invitations/${invitationId}`,
	);
	const snapshot = await transaction.get(reference);
	return {
		document: parseStoredInvitation(
			snapshot.data(),
			communityId,
			invitationId,
		),
		reference,
	};
};

const isUsable = (
	document: ICommunityInvitationDocument,
	now: Timestamp,
): boolean =>
	document.lifecycle.status === 'Active' &&
	timestampMilliseconds(document.expiresAt) > now.toMillis();

export const timestampMilliseconds = (timestamp: {
	seconds: number;
	nanoseconds: number;
}): number => timestamp.seconds * 1000 + timestamp.nanoseconds / 1_000_000;

const createCandidate = (
	database: FirebaseFirestore.Firestore,
	communityId: string,
	userId: string,
	now: Timestamp,
	configuration: TCommunityInvitationEncryptionConfiguration,
): IInvitationCandidate => {
	const reference = database
		.collection(`communities/${communityId}/invitations`)
		.doc();
	const code = generateCommunityInvitationCode();
	const normalized = normalizeCommunityInvitationCode(code);
	const tokenDigest = digestCommunityInvitationCode(normalized);
	const expiresAt = Timestamp.fromMillis(
		now.toMillis() + INVITATION_LIFETIME_MILLISECONDS,
	);
	const document: ICommunityInvitationDocument = {
		schemaVersion: 1,
		invitationModelVersion: 2,
		invitationId: reference.id,
		communityId,
		createdByUserId: userId,
		expiresAt,
		lifecycle: { status: 'Active' },
		tokenDigest,
		encryptedCode: encryptCommunityInvitationCode(
			code,
			communityId,
			reference.id,
			configuration,
		),
		createdAt: now,
		updatedAt: now,
	};
	return {
		code,
		document,
		reference,
		lookup: {
			invitationModelVersion: 2,
			communityId,
			invitationId: reference.id,
			expiresAt,
		},
		lookupReference: database.doc(
			`communityInvitationDigests/${tokenDigest}`,
		),
	};
};

const updateCommunityPointer = (
	transaction: FirebaseFirestore.Transaction,
	community: IAuthorizedCommunity,
	activeInvitationId: string | null,
	now: Timestamp,
): void => {
	const revision: unknown = community.data.revision;
	if (
		typeof revision !== 'number' ||
		!Number.isInteger(revision) ||
		revision < 0 ||
		revision >= 2_147_483_646
	)
		throw dataUnavailable();
	transaction.update(community.reference, {
		activeInvitationId,
		revision: revision + 1,
		updatedAt: now,
	});
};

const operationReference = (
	database: FirebaseFirestore.Firestore,
	userId: string,
	operation: 'Issue' | 'Rotate' | 'Revoke',
	operationId: string,
): FirebaseFirestore.DocumentReference =>
	database.doc(
		`users/${userId}/communityInvitation${operation}Operations/${operationId}`,
	);

const requestMatches = (
	stored: unknown,
	input: TInvitationMutationRequest | IRevokeCommunityInvitationRequest,
): boolean => {
	if (!stored || typeof stored !== 'object' || Array.isArray(stored))
		return false;
	const request = stored as Record<string, unknown>;
	const expectedKeys =
		'invitationId' in input
			? ['communityId', 'invitationId']
			: ['communityId'];
	return (
		Object.keys(request).length === expectedKeys.length &&
		request['communityId'] === input.communityId &&
		(!('invitationId' in input) ||
			request['invitationId'] === input.invitationId)
	);
};

const assertOperationRequest = (
	operation: FirebaseFirestore.DocumentSnapshot,
	input: TInvitationMutationRequest | IRevokeCommunityInvitationRequest,
): FirebaseFirestore.DocumentData | null => {
	if (!operation.exists) return null;
	const data = operation.data();
	if (!data || !requestMatches(data.request, input))
		throw invitationError(
			'already-exists',
			'This operation ID was already used for a different invitation request.',
			'OperationPayloadMismatch',
		);
	return data;
};

const createInvitationMutation = async (
	userId: string,
	input: TInvitationMutationRequest,
	operation: 'Issue' | 'Rotate',
	dependencies: IInvitationDependencies,
): Promise<
	IIssueCommunityInvitationResult | IRotateCommunityInvitationResult
> => {
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const candidate = createCandidate(
		database,
		input.communityId,
		userId,
		now,
		dependencies.encryptionConfiguration,
	);
	const receiptReference = operationReference(
		database,
		userId,
		operation,
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const community = await requireAuthorizedCommunity(
			transaction,
			database,
			userId,
			input.communityId,
		);
		const [receipt, candidateLookup] = await Promise.all([
			transaction.get(receiptReference),
			transaction.get(candidate.lookupReference),
		]);
		const previousReceipt = assertOperationRequest(receipt, input);
		if (previousReceipt) {
			if (!isIdentifier(previousReceipt.invitationId))
				throw dataUnavailable();
			const previous = await readInvitation(
				transaction,
				database,
				input.communityId,
				previousReceipt.invitationId,
			);
			if (!isUsable(previous.document, now))
				throw invitationUnavailable();
			return {
				invitation: decryptInvitation(
					previous.document,
					dependencies.encryptionConfiguration,
				),
			};
		}
		if (candidateLookup.exists)
			throw invitationError(
				'aborted',
				'A new community invitation could not be created. Please try again.',
				'InvitationUnavailable',
			);

		let current: Awaited<ReturnType<typeof readInvitation>> | undefined;
		if (community.activeInvitationId)
			current = await readInvitation(
				transaction,
				database,
				input.communityId,
				community.activeInvitationId,
			);

		if (
			operation === 'Issue' &&
			current &&
			isUsable(current.document, now)
		) {
			transaction.create(receiptReference, {
				request: { communityId: input.communityId },
				invitationId: current.document.invitationId,
				createdAt: now,
			});
			return {
				invitation: decryptInvitation(
					current.document,
					dependencies.encryptionConfiguration,
				),
			};
		}

		if (current) {
			transaction.update(current.reference, {
				lifecycle:
					operation === 'Issue' &&
					timestampMilliseconds(current.document.expiresAt) <=
						now.toMillis()
						? { status: 'Expired' }
						: { status: 'Revoked', revokedAt: now },
				updatedAt: now,
			});
			transaction.delete(
				database.doc(
					`communityInvitationDigests/${current.document.tokenDigest}`,
				),
			);
		}
		transaction.create(candidate.reference, candidate.document);
		transaction.create(candidate.lookupReference, candidate.lookup);
		transaction.create(receiptReference, {
			request: { communityId: input.communityId },
			invitationId: candidate.document.invitationId,
			createdAt: now,
		});
		updateCommunityPointer(
			transaction,
			community,
			candidate.document.invitationId,
			now,
		);
		return {
			invitation: {
				communityId: input.communityId,
				invitationId: candidate.document.invitationId,
				code: candidate.code,
				expiresAt: serializeTimestamp(candidate.document.expiresAt),
			},
		};
	});
};

export const issueCommunityInvitationForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IInvitationDependencies,
): Promise<IIssueCommunityInvitationResult> => {
	const input = parseCallableInput(
		parseIssueCommunityInvitationRequest,
		value,
	);
	return createInvitationMutation(userId, input, 'Issue', dependencies);
};

export const getCurrentCommunityInvitationForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IInvitationDependencies,
): Promise<IGetCurrentCommunityInvitationResult> => {
	const input = parseCallableInput(
		parseGetCurrentCommunityInvitationRequest,
		value,
	);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	return database.runTransaction(async (transaction) => {
		const community = await requireAuthorizedCommunity(
			transaction,
			database,
			userId,
			input.communityId,
		);
		if (!community.activeInvitationId) return { invitation: null };
		const current = await readInvitation(
			transaction,
			database,
			input.communityId,
			community.activeInvitationId,
		);
		if (!isUsable(current.document, now)) return { invitation: null };
		return {
			invitation: decryptInvitation(
				current.document,
				dependencies.encryptionConfiguration,
			),
		};
	});
};

export const rotateCommunityInvitationForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IInvitationDependencies,
): Promise<IRotateCommunityInvitationResult> => {
	const input = parseCallableInput(
		parseRotateCommunityInvitationRequest,
		value,
	);
	return createInvitationMutation(userId, input, 'Rotate', dependencies);
};

export const revokeCommunityInvitationForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IRevokeDependencies = {},
): Promise<IRevokeCommunityInvitationResult> => {
	const input = parseCallableInput(
		parseRevokeCommunityInvitationRequest,
		value,
	);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const receiptReference = operationReference(
		database,
		userId,
		'Revoke',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const community = await requireAuthorizedCommunity(
			transaction,
			database,
			userId,
			input.communityId,
		);
		const receipt = await transaction.get(receiptReference);
		const previousReceipt = assertOperationRequest(receipt, input);
		if (previousReceipt) {
			if (
				previousReceipt.invitationId !== input.invitationId ||
				!(previousReceipt.revokedAt instanceof Timestamp)
			)
				throw dataUnavailable();
			return {
				communityId: input.communityId,
				invitationId: input.invitationId,
				revokedAt: serializeTimestamp(previousReceipt.revokedAt),
			};
		}
		if (community.activeInvitationId !== input.invitationId)
			throw invitationUnavailable();
		const current = await readInvitation(
			transaction,
			database,
			input.communityId,
			input.invitationId,
		);
		if (current.document.lifecycle.status !== 'Active')
			throw invitationUnavailable();
		transaction.update(current.reference, {
			lifecycle: { status: 'Revoked', revokedAt: now },
			updatedAt: now,
		});
		transaction.delete(
			database.doc(
				`communityInvitationDigests/${current.document.tokenDigest}`,
			),
		);
		transaction.create(receiptReference, {
			request: {
				communityId: input.communityId,
				invitationId: input.invitationId,
			},
			invitationId: input.invitationId,
			revokedAt: now,
			createdAt: now,
		});
		updateCommunityPointer(transaction, community, null, now);
		return {
			communityId: input.communityId,
			invitationId: input.invitationId,
			revokedAt: serializeTimestamp(now),
		};
	});
};

const encryptionConfiguration =
	(): TCommunityInvitationEncryptionConfiguration =>
		parseCommunityInvitationEncryptionConfiguration(
			communityInvitationEncryptionKeys.value(),
		);

export const issueCommunityInvitation = onCall(
	{ secrets: [communityInvitationEncryptionKeys] },
	async (request) =>
		issueCommunityInvitationForAccount(
			requireInvitationAccount(request.auth),
			request.data,
			{ encryptionConfiguration: encryptionConfiguration() },
		),
);

export const getCurrentCommunityInvitation = onCall(
	{ secrets: [communityInvitationEncryptionKeys] },
	async (request) =>
		getCurrentCommunityInvitationForAccount(
			requireInvitationAccount(request.auth),
			request.data,
			{ encryptionConfiguration: encryptionConfiguration() },
		),
);

export const rotateCommunityInvitation = onCall(
	{ secrets: [communityInvitationEncryptionKeys] },
	async (request) =>
		rotateCommunityInvitationForAccount(
			requireInvitationAccount(request.auth),
			request.data,
			{ encryptionConfiguration: encryptionConfiguration() },
		),
);

export const revokeCommunityInvitation = onCall(async (request) =>
	revokeCommunityInvitationForAccount(
		requireInvitationAccount(request.auth),
		request.data,
	),
);
