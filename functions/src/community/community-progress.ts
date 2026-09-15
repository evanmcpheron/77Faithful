import {
	FieldPath,
	getFirestore,
	Timestamp,
	type DocumentData,
	type DocumentSnapshot,
	type Firestore,
	type QueryDocumentSnapshot,
	type Transaction,
} from 'firebase-admin/firestore';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
	CommunityProgressLimits,
	parseGetCommunityAggregateProgressRequest,
	parseGetCommunityProgressSharingRequest,
	parseListSharedCommunityProgressRequest,
	parseSetCommunityProgressSharingRequest,
} from '../../generated/features/communities/community-progress';
import type {
	ICommunityAggregateProgress,
	ICommunityProgressSharingPreferenceDocument,
	IGetCommunityAggregateProgressRequest,
	IGetCommunityProgressSharingResult,
	IListSharedCommunityProgressRequest,
	IListSharedCommunityProgressResult,
	ISetCommunityProgressSharingResult,
	ISharedCommunityProgress,
	TCommunityAggregateProgressResult,
	TCommunityProgressConsent,
} from '../../generated/types/community/community-progress.types';
import { onCall } from './community-callable';
import { resolveCommunityDisplayName } from './read-community';

interface IDependencies {
	database?: Firestore;
	now?: Timestamp;
}
type TReason =
	| 'AuthenticationRequired'
	| 'EmailVerificationRequired'
	| 'InvalidInput'
	| 'InvalidCursor'
	| 'AccountUnavailable'
	| 'CommunityUnavailable'
	| 'CommunityClosed'
	| 'JourneyUnavailable'
	| 'OperationPayloadMismatch'
	| 'ProgressDataUnavailable';
const error = (
	code: ConstructorParameters<typeof HttpsError>[0],
	message: string,
	reason: TReason,
) => new HttpsError(code, message, { reason });
const unavailable = () =>
	error(
		'internal',
		'Progress could not be loaded. Please try again.',
		'ProgressDataUnavailable',
	);
const parse = <T>(parser: (value: unknown) => T, value: unknown): T => {
	try {
		return parser(value);
	} catch {
		throw error(
			'invalid-argument',
			'Check the progress request.',
			'InvalidInput',
		);
	}
};
export const requireCommunityProgressAccount = (
	auth: CallableRequest['auth'],
): string => {
	if (!auth)
		throw error(
			'unauthenticated',
			'Sign in to open community progress.',
			'AuthenticationRequired',
		);
	if (auth.token.email_verified !== true)
		throw error(
			'permission-denied',
			'Confirm your email to open community progress.',
			'EmailVerificationRequired',
		);
	return auth.uid;
};
const hash = (value: unknown): string =>
	createHash('sha256').update(JSON.stringify(value)).digest('hex');
const preferenceReference = (
	database: Firestore,
	userId: string,
	communityId: string,
	communityJourneyId: string,
) =>
	database.doc(
		`users/${userId}/communityProgressPreferences/${hash([communityId, communityJourneyId])}`,
	);
const privateEnrollmentReference = (
	database: Firestore,
	userId: string,
	journeyId: string,
) => database.doc(`users/${userId}/communityJourneyEnrollments/${journeyId}`);
const isConsent = (value: unknown): value is TCommunityProgressConsent => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		return false;
	const record = value as Record<string, unknown>;
	return (
		(record['status'] === 'Private' && Object.keys(record).length === 1) ||
		(record['status'] === 'Shared' &&
			Object.keys(record).length === 2 &&
			record['consentedAt'] instanceof Timestamp)
	);
};
const storedPreference = (
	snapshot: DocumentSnapshot,
	userId: string,
	communityId: string,
	journeyId: string,
): ICommunityProgressSharingPreferenceDocument | null => {
	if (!snapshot.exists) return null;
	const data = snapshot.data();
	if (
		!data ||
		data.schemaVersion !== 1 ||
		data.userId !== userId ||
		data.communityId !== communityId ||
		data.communityJourneyId !== journeyId ||
		!isConsent(data.individualProgress) ||
		!isConsent(data.aggregateProgress) ||
		!(data.createdAt instanceof Timestamp) ||
		!(data.updatedAt instanceof Timestamp)
	)
		throw unavailable();
	return data as ICommunityProgressSharingPreferenceDocument;
};
const sharingResult = (
	communityId: string,
	communityJourneyId: string,
	preference: ICommunityProgressSharingPreferenceDocument | null,
): IGetCommunityProgressSharingResult => ({
	communityId,
	communityJourneyId,
	individualProgress: preference?.individualProgress ?? { status: 'Private' },
	aggregateProgress: preference?.aggregateProgress ?? { status: 'Private' },
});

const authorized = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	communityId: string,
	journeyId: string,
) => {
	const [profile, community, member, schedule] = await Promise.all([
		transaction.get(database.doc(`users/${userId}`)),
		transaction.get(database.doc(`communities/${communityId}`)),
		transaction.get(
			database.doc(`communities/${communityId}/members/${userId}`),
		),
		transaction.get(
			database.doc(
				`communities/${communityId}/communityJourneys/${journeyId}`,
			),
		),
	]);
	if (!profile.exists)
		throw error(
			'failed-precondition',
			'Your account is unavailable.',
			'AccountUnavailable',
		);
	if (
		!community.exists ||
		member.get('userId') !== userId ||
		member.get('communityId') !== communityId ||
		member.get('lifecycle.status') !== 'Active'
	)
		throw error(
			'permission-denied',
			'This community is unavailable to your account.',
			'CommunityUnavailable',
		);
	if (community.get('lifecycle.status') !== 'Active')
		throw error(
			'failed-precondition',
			'This community is closed.',
			'CommunityClosed',
		);
	if (
		!schedule.exists ||
		schedule.get('communityId') !== communityId ||
		!['Scheduled', 'Active', 'Completed'].includes(
			schedule.get('lifecycle.status'),
		)
	)
		throw error(
			'failed-precondition',
			'This community journey is unavailable.',
			'JourneyUnavailable',
		);
	return { community, schedule };
};
const currentEnrollment = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	communityId: string,
	journeyId: string,
): Promise<DocumentData | null> => {
	const enrollment = (
		await transaction.get(
			privateEnrollmentReference(database, userId, journeyId),
		)
	).data();
	return enrollment?.userId === userId &&
		enrollment?.communityId === communityId &&
		enrollment?.communityJourneyId === journeyId &&
		['Enrolled', 'Started'].includes(enrollment.lifecycle?.status)
		? enrollment
		: null;
};
const currentStage = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	enrollment: DocumentData,
): Promise<ISharedCommunityProgress['journeyStage'] | null> => {
	const link: unknown = enrollment.lifecycle?.journeyId;
	if (
		enrollment.lifecycle?.status !== 'Started' ||
		typeof link !== 'string' ||
		!/^[A-Za-z0-9_-]{1,128}$/.test(link)
	)
		return null;
	const journey = await transaction.get(
		database.doc(`users/${userId}/journeys/${link}`),
	);
	if (journey.get('userId') !== userId) return null;
	const stage: unknown = journey.get('state.status');
	return stage === 'Active' || stage === 'Completed' || stage === 'EndedEarly'
		? stage
		: null;
};
const project = async (
	transaction: Transaction,
	database: Firestore,
	member: QueryDocumentSnapshot,
	communityId: string,
	journeyId: string,
	now: Timestamp,
): Promise<{
	individual: ISharedCommunityProgress | null;
	aggregateStage: ISharedCommunityProgress['journeyStage'] | null;
	fullyConsenting: boolean;
}> => {
	const userId = member.id;
	if (
		member.get('userId') !== userId ||
		member.get('communityId') !== communityId ||
		member.get('lifecycle.status') !== 'Active'
	)
		return {
			individual: null,
			aggregateStage: null,
			fullyConsenting: false,
		};
	const [preferenceSnapshot, enrollment, profile] = await Promise.all([
		transaction.get(
			preferenceReference(database, userId, communityId, journeyId),
		),
		currentEnrollment(
			transaction,
			database,
			userId,
			communityId,
			journeyId,
		),
		transaction.get(database.doc(`users/${userId}`)),
	]);
	if (!profile.exists)
		return {
			individual: null,
			aggregateStage: null,
			fullyConsenting: false,
		};
	const preference = storedPreference(
		preferenceSnapshot,
		userId,
		communityId,
		journeyId,
	);
	if (!enrollment || !preference)
		return {
			individual: null,
			aggregateStage: null,
			fullyConsenting: false,
		};
	const individualConsent = preference.individualProgress.status === 'Shared';
	const aggregateConsent = preference.aggregateProgress.status === 'Shared';
	if (!individualConsent && !aggregateConsent)
		return {
			individual: null,
			aggregateStage: null,
			fullyConsenting: false,
		};
	const stage = await currentStage(transaction, database, userId, enrollment);
	if (!stage)
		return {
			individual: null,
			aggregateStage: null,
			fullyConsenting: false,
		};
	return {
		individual: individualConsent
			? {
					communityId,
					communityJourneyId: journeyId,
					participant: {
						userId,
						displayName: resolveCommunityDisplayName(
							profile.get('preferredName'),
						),
					},
					journeyStage: stage,
					calculatedAt: now,
				}
			: null,
		aggregateStage: aggregateConsent ? stage : null,
		fullyConsenting: aggregateConsent,
	};
};

export const getCommunityProgressSharingForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<IGetCommunityProgressSharingResult> => {
	const input = parse(parseGetCommunityProgressSharingRequest, value);
	const database = dependencies.database ?? getFirestore();
	return database.runTransaction(async (transaction) => {
		await authorized(
			transaction,
			database,
			userId,
			input.communityId,
			input.communityJourneyId,
		);
		const preference = storedPreference(
			await transaction.get(
				preferenceReference(
					database,
					userId,
					input.communityId,
					input.communityJourneyId,
				),
			),
			userId,
			input.communityId,
			input.communityJourneyId,
		);
		return sharingResult(
			input.communityId,
			input.communityJourneyId,
			preference,
		);
	});
};

export const setCommunityProgressSharingForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<ISetCommunityProgressSharingResult> => {
	const input = parse(parseSetCommunityProgressSharingRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const receiptRef = database.doc(
		`users/${userId}/communityProgressSetOperations/${input.operationId}`,
	);
	const payloadDigest = hash([
		input.communityId,
		input.communityJourneyId,
		input.shouldShareIndividualProgress,
		input.shouldContributeToAggregateProgress,
	]);
	return database.runTransaction(async (transaction) => {
		await authorized(
			transaction,
			database,
			userId,
			input.communityId,
			input.communityJourneyId,
		);
		const enrollment = await currentEnrollment(
			transaction,
			database,
			userId,
			input.communityId,
			input.communityJourneyId,
		);
		if (!enrollment)
			throw error(
				'failed-precondition',
				'This enrollment is unavailable.',
				'JourneyUnavailable',
			);
		const receipt = await transaction.get(receiptRef);
		const prefRef = preferenceReference(
			database,
			userId,
			input.communityId,
			input.communityJourneyId,
		);
		const existing = storedPreference(
			await transaction.get(prefRef),
			userId,
			input.communityId,
			input.communityJourneyId,
		);
		if (receipt.exists) {
			if (receipt.get('payloadDigest') !== payloadDigest)
				throw error(
					'already-exists',
					'This progress change ID was used for another change.',
					'OperationPayloadMismatch',
				);
			const prior = receipt.get('result');
			if (
				!prior ||
				!isConsent(prior.individualProgress) ||
				!isConsent(prior.aggregateProgress)
			)
				throw unavailable();
			// A later revocation wins over a replay of an older shared receipt.
			return sharingResult(
				input.communityId,
				input.communityJourneyId,
				existing,
			);
		}
		const consent = (
			enabled: boolean,
			previous: TCommunityProgressConsent | undefined,
		): TCommunityProgressConsent =>
			enabled
				? previous?.status === 'Shared'
					? previous
					: { status: 'Shared', consentedAt: now }
				: { status: 'Private' };
		const preference: ICommunityProgressSharingPreferenceDocument = {
			schemaVersion: 1,
			communityId: input.communityId,
			communityJourneyId: input.communityJourneyId,
			userId,
			individualProgress: consent(
				input.shouldShareIndividualProgress,
				existing?.individualProgress,
			),
			aggregateProgress: consent(
				input.shouldContributeToAggregateProgress,
				existing?.aggregateProgress,
			),
			createdAt: existing?.createdAt ?? now,
			updatedAt: now,
		};
		const result = sharingResult(
			input.communityId,
			input.communityJourneyId,
			preference,
		);
		transaction.set(prefRef, preference);
		transaction.create(receiptRef, {
			payloadDigest,
			result,
			createdAt: now,
		});
		return result;
	});
};

interface IProgressCursor {
	version: 1;
	communityId: string;
	journeyId: string;
	seconds: number;
	nanoseconds: number;
	memberId: string;
}
const encodeCursor = (
	input: IListSharedCommunityProgressRequest,
	member: QueryDocumentSnapshot,
): string => {
	const joinedAt: unknown = member.get('joinedAt');
	if (!(joinedAt instanceof Timestamp)) throw unavailable();
	return Buffer.from(
		JSON.stringify({
			version: 1,
			communityId: input.communityId,
			journeyId: input.communityJourneyId,
			seconds: joinedAt.seconds,
			nanoseconds: joinedAt.nanoseconds,
			memberId: member.id,
		} satisfies IProgressCursor),
	).toString('base64url');
};
const decodeCursor = (
	value: string,
	input: IListSharedCommunityProgressRequest,
): IProgressCursor => {
	try {
		const decoded: unknown = JSON.parse(
			Buffer.from(value, 'base64url').toString('utf8'),
		);
		if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded))
			throw new Error();
		const cursor = decoded as Record<string, unknown>;
		if (
			Object.keys(cursor).length !== 6 ||
			cursor['version'] !== 1 ||
			cursor['communityId'] !== input.communityId ||
			cursor['journeyId'] !== input.communityJourneyId ||
			typeof cursor['seconds'] !== 'number' ||
			!Number.isSafeInteger(cursor['seconds']) ||
			typeof cursor['nanoseconds'] !== 'number' ||
			!Number.isInteger(cursor['nanoseconds']) ||
			cursor['nanoseconds'] < 0 ||
			cursor['nanoseconds'] > 999999999 ||
			typeof cursor['memberId'] !== 'string' ||
			!/^[A-Za-z0-9_-]{1,128}$/.test(cursor['memberId'])
		)
			throw new Error();
		if (Buffer.from(JSON.stringify(cursor)).toString('base64url') !== value)
			throw new Error();
		return cursor as unknown as IProgressCursor;
	} catch {
		throw error(
			'invalid-argument',
			'Start the progress list again.',
			'InvalidCursor',
		);
	}
};

export const listSharedCommunityProgressForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<IListSharedCommunityProgressResult> => {
	const input = parse(parseListSharedCommunityProgressRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const cursor = input.cursor ? decodeCursor(input.cursor, input) : null;
	return database.runTransaction(async (transaction) => {
		await authorized(
			transaction,
			database,
			userId,
			input.communityId,
			input.communityJourneyId,
		);
		let query = database
			.collection(`communities/${input.communityId}/members`)
			.where('lifecycle.status', '==', 'Active')
			.orderBy('joinedAt')
			.orderBy(FieldPath.documentId())
			.limit(
				(input.pageSize ?? CommunityProgressLimits.defaultPageSize) + 1,
			);
		if (cursor)
			query = query.startAfter(
				new Timestamp(cursor.seconds, cursor.nanoseconds),
				cursor.memberId,
			);
		const page = await transaction.get(query);
		const candidates = page.docs.slice(
			0,
			input.pageSize ?? CommunityProgressLimits.defaultPageSize,
		);
		const progress: ISharedCommunityProgress[] = [];
		for (const member of candidates) {
			const projected = await project(
				transaction,
				database,
				member,
				input.communityId,
				input.communityJourneyId,
				now,
			);
			if (projected.individual) progress.push(projected.individual);
		}
		return {
			progress,
			nextCursor:
				page.size > candidates.length && candidates.length > 0
					? encodeCursor(input, candidates[candidates.length - 1]!)
					: null,
		};
	});
};

const guidance =
	'These counts describe only participants who chose to contribute. They do not measure faith or spiritual growth.';
const suppressedGuidance =
	'Community progress is unavailable to protect participants’ privacy. Your own journey remains yours.';
export const getCommunityAggregateProgressForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<TCommunityAggregateProgressResult> => {
	const input: IGetCommunityAggregateProgressRequest = parse(
		parseGetCommunityAggregateProgressRequest,
		value,
	);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	return database.runTransaction(async (transaction) => {
		await authorized(
			transaction,
			database,
			userId,
			input.communityId,
			input.communityJourneyId,
		);
		const members = await transaction.get(
			database
				.collection(`communities/${input.communityId}/members`)
				.where('lifecycle.status', '==', 'Active')
				.orderBy('joinedAt')
				.orderBy(FieldPath.documentId())
				.limit(51),
		);
		const suppressed: TCommunityAggregateProgressResult = {
			status: 'Suppressed',
			progress: null,
			guidance: suppressedGuidance,
		};
		if (members.empty || members.size > 50) return suppressed;
		const stages = { Active: 0, Completed: 0, EndedEarly: 0 };
		for (const member of members.docs) {
			const projected = await project(
				transaction,
				database,
				member,
				input.communityId,
				input.communityJourneyId,
				now,
			);
			// Publish no total if a roster subtraction could identify a noncontributor.
			if (!projected.fullyConsenting || !projected.aggregateStage)
				return suppressed;
			stages[projected.aggregateStage]++;
		}
		if (
			members.size < 5 ||
			Object.values(stages).some((count) => count > 0 && count < 5)
		)
			return suppressed;
		const progress: ICommunityAggregateProgress = {
			communityId: input.communityId,
			communityJourneyId: input.communityJourneyId,
			contributingMemberCount: members.size,
			activeJourneyCount: stages.Active,
			completedJourneyCount: stages.Completed,
			endedEarlyJourneyCount: stages.EndedEarly,
			calculatedAt: now,
		};
		return { status: 'Available', progress, guidance };
	});
};

export const getCommunityProgressSharing = onCall(async (request) =>
	getCommunityProgressSharingForAccount(
		requireCommunityProgressAccount(request.auth),
		request.data,
	),
);
export const setCommunityProgressSharing = onCall(async (request) =>
	setCommunityProgressSharingForAccount(
		requireCommunityProgressAccount(request.auth),
		request.data,
	),
);
export const listSharedCommunityProgress = onCall(async (request) =>
	listSharedCommunityProgressForAccount(
		requireCommunityProgressAccount(request.auth),
		request.data,
	),
);
export const getCommunityAggregateProgress = onCall(async (request) =>
	getCommunityAggregateProgressForAccount(
		requireCommunityProgressAccount(request.auth),
		request.data,
	),
);
