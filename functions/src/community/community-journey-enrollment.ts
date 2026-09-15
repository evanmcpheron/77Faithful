import {
	getFirestore,
	Timestamp,
	type Firestore,
	type Transaction,
} from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
	parseCommunityTimeZoneId,
	parseEnrollCommunityJourneyRequest,
	parseGetCommunityJourneyEnrollmentRequest,
	parseWithdrawCommunityJourneyEnrollmentRequest,
} from '../../generated/features/communities/community-journey';
import { getJourneyCalendarDate } from '../../generated/features/journey/journey-calendar';
import type { IJourneySetupDraftDocument } from '../../generated/types/account/journey-setup.types';
import type {
	IEnrollCommunityJourneyResult,
	IGetCommunityJourneyEnrollmentResult,
	IWithdrawCommunityJourneyEnrollmentResult,
	TCommunityJourneyEnrollmentReasonCode,
} from '../../generated/types/community/community-function.types';
import type {
	ICommunityJourneyDocument,
	ICommunityJourneyEnrollmentDocument,
} from '../../generated/types/community/community-journey.types';
import type { IWritingRevisionDocument } from '../../generated/types/journey/journey-writing.types';
import {
	isReadyJourneySetup,
	requirePublishedCourse,
} from '../journey/start-journey';
import { safeCommunityJourneyPreview } from './community-journey';
import { requireCommunityAccount } from './read-community';

interface IDependencies {
	database?: Firestore;
	now?: Timestamp;
}
const problem = (
	code: ConstructorParameters<typeof HttpsError>[0],
	message: string,
	reason: TCommunityJourneyEnrollmentReasonCode,
) => new HttpsError(code, message, { reason });
const parse = <T>(validator: (input: unknown) => T, input: unknown): T => {
	try {
		return validator(input);
	} catch {
		throw problem(
			'invalid-argument',
			'Check the enrollment details.',
			'InvalidInput',
		);
	}
};
const digest = (input: unknown) =>
	createHash('sha256').update(JSON.stringify(input)).digest('hex');
const owner = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
) => {
	const profile = await transaction.get(database.doc(`users/${userId}`));
	if (!profile.exists)
		throw problem(
			'failed-precondition',
			'Your account is unavailable. Sign in again.',
			'AccountUnavailable',
		);
};
const activeMember = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	communityId: string,
) => {
	const [community, member] = await Promise.all([
		transaction.get(database.doc(`communities/${communityId}`)),
		transaction.get(
			database.doc(`communities/${communityId}/members/${userId}`),
		),
	]);
	if (
		!member.exists ||
		member.get('userId') !== userId ||
		member.get('communityId') !== communityId ||
		member.get('lifecycle.status') !== 'Active'
	)
		throw problem(
			'permission-denied',
			'Your community membership has ended.',
			'MembershipEnded',
		);
	if (!community.exists)
		throw problem(
			'failed-precondition',
			'This community is unavailable.',
			'CommunityUnavailable',
		);
	if (community.get('lifecycle.status') !== 'Active')
		throw problem(
			'failed-precondition',
			'This community is closed.',
			'CommunityClosed',
		);
	if (
		community.get('organizerUserId') === userId ||
		member.get('role') === 'Organizer'
	)
		throw problem(
			'permission-denied',
			'The organizer cannot enroll as a participant.',
			'OrganizerCannotEnroll',
		);
	return community;
};
const schedule = async (
	transaction: Transaction,
	database: Firestore,
	communityId: string,
	communityJourneyId: string,
) => {
	const snapshot = await transaction.get(
		database.doc(
			`communities/${communityId}/communityJourneys/${communityJourneyId}`,
		),
	);
	const data = snapshot.data() as ICommunityJourneyDocument | undefined;
	if (
		!data ||
		data.communityId !== communityId ||
		data.schemaVersion !== 1 ||
		!Number.isSafeInteger(data.revision) ||
		!data.lifecycle ||
		!['Scheduled', 'Active', 'Completed', 'Canceled'].includes(
			data.lifecycle.status,
		) ||
		!(data.createdAt instanceof Timestamp) ||
		!(data.updatedAt instanceof Timestamp) ||
		!(
			data.firstEnrollmentAcceptedAt === null ||
			data.firstEnrollmentAcceptedAt instanceof Timestamp
		)
	)
		throw problem(
			'internal',
			'This schedule could not be loaded.',
			'EnrollmentDataUnavailable',
		);
	try {
		safeCommunityJourneyPreview(communityJourneyId, data, Timestamp.now());
	} catch {
		throw problem(
			'internal',
			'This schedule could not be loaded.',
			'EnrollmentDataUnavailable',
		);
	}
	return { reference: snapshot.ref, data };
};
const storedEnrollment = (
	data: FirebaseFirestore.DocumentData | undefined,
	userId: string,
	communityId: string,
	journeyId: string,
): ICommunityJourneyEnrollmentDocument | null => {
	if (!data) return null;
	if (
		data.schemaVersion !== 1 ||
		data.userId !== userId ||
		data.communityId !== communityId ||
		data.communityJourneyId !== journeyId ||
		!['Enrolled', 'Withdrawn', 'Started', 'StartBlocked'].includes(
			data.lifecycle?.status,
		) ||
		!(data.createdAt instanceof Timestamp) ||
		!(data.updatedAt instanceof Timestamp) ||
		!Number.isSafeInteger(data.setupRevision) ||
		!Number.isSafeInteger(data.scheduleRevision) ||
		!(data.activationConsentConfirmedAt instanceof Timestamp) ||
		data.setupDraftId !== 'current' ||
		(data.lifecycle.status === 'Withdrawn' &&
			!(data.lifecycle.withdrawnAt instanceof Timestamp)) ||
		(data.lifecycle.status === 'Started' &&
			(typeof data.lifecycle.journeyId !== 'string' ||
				!(data.lifecycle.startedAt instanceof Timestamp))) ||
		(data.lifecycle.status === 'StartBlocked' &&
			!(data.lifecycle.blockedAt instanceof Timestamp))
	)
		throw problem(
			'internal',
			'Your enrollment could not be loaded.',
			'EnrollmentDataUnavailable',
		);
	try {
		parseCommunityTimeZoneId(data.startingTimeZoneId);
	} catch {
		throw problem(
			'internal',
			'Your enrollment could not be loaded.',
			'EnrollmentDataUnavailable',
		);
	}
	return data as ICommunityJourneyEnrollmentDocument;
};
const readReceipt = (
	data: FirebaseFirestore.DocumentData | undefined,
	input: unknown,
) => {
	if (!data) return false;
	if (data.requestDigest !== digest(input))
		throw problem(
			'already-exists',
			'This operation ID was used with different details.',
			'OperationPayloadMismatch',
		);
	return true;
};
const privateEnrollment = (
	database: Firestore,
	userId: string,
	journeyId: string,
) => database.doc(`users/${userId}/communityJourneyEnrollments/${journeyId}`);
const receipt = (
	database: Firestore,
	userId: string,
	kind: 'Enroll' | 'Withdraw',
	operationId: string,
) =>
	database.doc(
		`users/${userId}/communityJourney${kind}Operations/${operationId}`,
	);
const confirmation = (
	journeyId: string,
	enrollment: ICommunityJourneyEnrollmentDocument,
	scheduleData: ICommunityJourneyDocument,
): IEnrollCommunityJourneyResult => ({
	communityJourneyEnrollmentId: journeyId,
	communityJourney: {
		communityJourneyId: journeyId,
		communityId: enrollment.communityId,
		revision: scheduleData.revision,
		course: scheduleData.course,
		startDate: scheduleData.startDate,
		timeZoneId: scheduleData.timeZoneId,
		status: scheduleData.lifecycle.status,
		canEnroll: false,
		canRevise: false,
	},
	enrolledAt: enrollment.createdAt,
	startingTimeZoneId: enrollment.startingTimeZoneId,
	groupDisplayStartDate: scheduleData.startDate,
	personalStartDateBehavior: 'ParticipantCalendarDay1',
});

const eligibility = (
	enrollment: ICommunityJourneyEnrollmentDocument,
	journey: ICommunityJourneyDocument,
	community: FirebaseFirestore.DocumentSnapshot,
	member: FirebaseFirestore.DocumentSnapshot,
	journeyId: string,
): NonNullable<
	IGetCommunityJourneyEnrollmentResult['enrollment']
>['activationEligibility'] => {
	if (enrollment.lifecycle.status !== 'Enrolled')
		return enrollment.lifecycle.status;
	if (!member.exists || member.get('lifecycle.status') !== 'Active')
		return 'MembershipEnded';
	if (community.get('lifecycle.status') !== 'Active')
		return 'CommunityClosed';
	if (
		journey.lifecycle.status === 'Canceled' ||
		community.get('currentCommunityJourneyId') !== journeyId
	)
		return 'ScheduleCanceled';
	if (!['Scheduled', 'Active'].includes(journey.lifecycle.status))
		return 'EnrollmentClosed';
	return 'Eligible';
};

export const enrollCommunityJourneyForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<IEnrollCommunityJourneyResult> => {
	const input = parse(parseEnrollCommunityJourneyRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const enrollmentReference = privateEnrollment(
		database,
		userId,
		input.communityJourneyId,
	);
	const operationReference = receipt(
		database,
		userId,
		'Enroll',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		await owner(transaction, database, userId);
		const community = await activeMember(
			transaction,
			database,
			userId,
			input.communityId,
		);
		const journey = await schedule(
			transaction,
			database,
			input.communityId,
			input.communityJourneyId,
		);
		const [
			priorOperation,
			priorEnrollment,
			control,
			activeJourneys,
			draftSnapshot,
		] = await Promise.all([
			transaction.get(operationReference),
			transaction.get(enrollmentReference),
			transaction.get(
				database.doc(`users/${userId}/journeyControl/current`),
			),
			transaction.get(
				database
					.collection(`users/${userId}/journeys`)
					.where('state.status', '==', 'Active')
					.limit(1),
			),
			transaction.get(
				database.doc(
					`users/${userId}/journeySetupDrafts/${input.setupDraftId}`,
				),
			),
		]);
		void control; // Shared lock read serializes against personal journey starts.
		const existing = storedEnrollment(
			priorEnrollment.data(),
			userId,
			input.communityId,
			input.communityJourneyId,
		);
		if (readReceipt(priorOperation.data(), input)) {
			if (
				community.get('currentCommunityJourneyId') !==
					input.communityJourneyId ||
				journey.data.lifecycle.status === 'Canceled'
			)
				throw problem(
					'failed-precondition',
					'This schedule was canceled or replaced.',
					'ScheduleCanceled',
				);
			if (!existing || existing.lifecycle.status !== 'Enrolled')
				throw problem(
					'failed-precondition',
					'This enrollment is no longer active.',
					'EnrollmentWithdrawn',
				);
			if (activeJourneys.size > 0)
				throw problem(
					'failed-precondition',
					'You already have an active personal journey.',
					'ActivePersonalJourney',
				);
			return confirmation(
				input.communityJourneyId,
				existing,
				journey.data,
			);
		}
		if (existing)
			throw problem(
				'already-exists',
				'You already confirmed or left this enrollment.',
				existing.lifecycle.status === 'Withdrawn'
					? 'EnrollmentWithdrawn'
					: 'EnrollmentAlreadyExists',
			);
		if (
			community.get('currentCommunityJourneyId') !==
				input.communityJourneyId ||
			journey.data.lifecycle.status === 'Canceled'
		)
			throw problem(
				'failed-precondition',
				'This schedule was canceled or replaced.',
				'ScheduleCanceled',
			);
		if (
			journey.data.lifecycle.status !== 'Scheduled' ||
			journey.data.revision !== input.expectedCommunityJourneyRevision
		)
			throw problem(
				'aborted',
				'This schedule changed. Review it again.',
				'ScheduleChanged',
			);
		if (
			journey.data.lifecycle.enrollmentWindow !== 'Open' ||
			getJourneyCalendarDate(now.toDate(), journey.data.timeZoneId) >=
				journey.data.startDate
		)
			throw problem(
				'failed-precondition',
				'Enrollment has closed for this schedule.',
				'EnrollmentClosed',
			);
		if (activeJourneys.size > 0)
			throw problem(
				'failed-precondition',
				'You already have an active personal journey.',
				'ActivePersonalJourney',
			);
		const draft = draftSnapshot.data() as
			IJourneySetupDraftDocument | undefined;
		if (
			!draft ||
			draft.schemaVersion !== 1 ||
			draft.userId !== userId ||
			draft.revision !== input.expectedSetupRevision
		)
			throw problem(
				'aborted',
				'Your setup changed. Load and review it again.',
				'SetupChanged',
			);
		if (!isReadyJourneySetup(draft))
			throw problem(
				'failed-precondition',
				'Review your practices and translation before enrolling.',
				'SetupInvalid',
			);
		const publishedCourse = await requirePublishedCourse(
			transaction,
			database,
			draft.choices.bibleVersionId,
		).catch((caught) => {
			if (
				caught instanceof HttpsError &&
				(caught.details as { reason?: string } | undefined)?.reason ===
					'ContentUnavailable'
			)
				throw problem(
					'failed-precondition',
					'Selected reading content is unavailable.',
					'ContentUnavailable',
				);
			throw caught;
		});
		if (
			publishedCourse.courseId !== journey.data.course.courseId ||
			publishedCourse.courseVersionId !==
				journey.data.course.courseVersionId
		)
			throw problem(
				'failed-precondition',
				'This course version is unavailable for enrollment.',
				'ContentUnavailable',
			);
		let motivationRevision: IWritingRevisionDocument | null = null;
		if (draft.startingMotivation) {
			const revision = await transaction.get(
				database.doc(
					`users/${userId}/journeySetupDrafts/${input.setupDraftId}/writingRevisions/${draft.startingMotivation.revisionId}`,
				),
			);
			const data = revision.data() as
				IWritingRevisionDocument | undefined;
			if (
				!data ||
				data.userId !== userId ||
				data.target.kind !== 'SetupMotivation' ||
				data.target.setupDraftId !== input.setupDraftId ||
				data.text !== draft.startingMotivation.text ||
				!(data.savedAt instanceof Timestamp)
			)
				throw problem(
					'failed-precondition',
					'Your saved writing could not be loaded. Review setup and try again.',
					'WritingUnavailable',
				);
			motivationRevision = data;
		}
		const enrollment: ICommunityJourneyEnrollmentDocument = {
			schemaVersion: 1,
			communityId: input.communityId,
			communityJourneyId: input.communityJourneyId,
			userId,
			optionalPracticeIds: [
				...draft.choices.optionalPracticeIds,
			] as ICommunityJourneyEnrollmentDocument['optionalPracticeIds'],
			bibleVersionId: draft.choices.bibleVersionId,
			setupDraftId: input.setupDraftId,
			setupRevision: draft.revision,
			scheduleRevision: journey.data.revision,
			startingTimeZoneId: input.startingTimeZoneId,
			activationConsentConfirmedAt: now,
			startingMotivation: draft.startingMotivation
				? { ...draft.startingMotivation }
				: null,
			startingMotivationRevision: motivationRevision
				? { ...motivationRevision }
				: null,
			lifecycle: { status: 'Enrolled' },
			createdAt: now,
			updatedAt: now,
		};
		transaction.create(enrollmentReference, enrollment);
		if (journey.data.firstEnrollmentAcceptedAt === null)
			transaction.update(journey.reference, {
				firstEnrollmentAcceptedAt: now,
				updatedAt: now,
			});
		transaction.create(operationReference, {
			requestDigest: digest(input),
			createdAt: now,
		});
		return confirmation(input.communityJourneyId, enrollment, journey.data);
	});
};

export const getCommunityJourneyEnrollmentForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<IGetCommunityJourneyEnrollmentResult> => {
	const input = parse(parseGetCommunityJourneyEnrollmentRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	return database.runTransaction(async (transaction) => {
		await owner(transaction, database, userId);
		const [enrollmentSnapshot, journey, community, member, activeJourneys] =
			await Promise.all([
				transaction.get(
					privateEnrollment(
						database,
						userId,
						input.communityJourneyId,
					),
				),
				schedule(
					transaction,
					database,
					input.communityId,
					input.communityJourneyId,
				),
				transaction.get(
					database.doc(`communities/${input.communityId}`),
				),
				transaction.get(
					database.doc(
						`communities/${input.communityId}/members/${userId}`,
					),
				),
				transaction.get(
					database
						.collection(`users/${userId}/journeys`)
						.where('state.status', '==', 'Active')
						.limit(1),
				),
			]);
		const enrollment = storedEnrollment(
			enrollmentSnapshot.data(),
			userId,
			input.communityId,
			input.communityJourneyId,
		);
		let activationEligibility: NonNullable<
			IGetCommunityJourneyEnrollmentResult['enrollment']
		>['activationEligibility'] = 'EnrollmentClosed';
		if (enrollment) {
			activationEligibility = eligibility(
				enrollment,
				journey.data,
				community,
				member,
				input.communityJourneyId,
			);
			if (activationEligibility === 'Eligible' && activeJourneys.size > 0)
				activationEligibility = 'ActivePersonalJourney';
		}
		return {
			enrollment: enrollment
				? {
						communityJourneyEnrollmentId: input.communityJourneyId,
						communityId: input.communityId,
						communityJourneyId: input.communityJourneyId,
						groupDisplayStartDate: journey.data.startDate,
						communityTimeZoneId: journey.data.timeZoneId,
						startingTimeZoneId: enrollment.startingTimeZoneId,
						communityCalendarDate: getJourneyCalendarDate(
							now.toDate(),
							journey.data.timeZoneId,
						),
						startingZoneCalendarDate: getJourneyCalendarDate(
							now.toDate(),
							enrollment.startingTimeZoneId,
						),
						personalStartDateBehavior:
							'ParticipantCalendarDay1' as const,
						lifecycle: enrollment.lifecycle,
						enrolledAt: enrollment.createdAt,
						activationEligibility,
					}
				: null,
		};
	});
};

export const withdrawCommunityJourneyEnrollmentForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<IWithdrawCommunityJourneyEnrollmentResult> => {
	const input = parse(parseWithdrawCommunityJourneyEnrollmentRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const enrollmentReference = privateEnrollment(
		database,
		userId,
		input.communityJourneyId,
	);
	const operationReference = receipt(
		database,
		userId,
		'Withdraw',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		await owner(transaction, database, userId);
		const [operation, snapshot] = await Promise.all([
			transaction.get(operationReference),
			transaction.get(enrollmentReference),
		]);
		const enrollment = storedEnrollment(
			snapshot.data(),
			userId,
			input.communityId,
			input.communityJourneyId,
		);
		if (!enrollment)
			throw problem(
				'failed-precondition',
				'No enrollment is available to withdraw.',
				'EnrollmentUnavailable',
			);
		if (readReceipt(operation.data(), input)) {
			if (enrollment.lifecycle.status !== 'Withdrawn')
				throw problem(
					'failed-precondition',
					'This enrollment has already started.',
					'EnrollmentStarted',
				);
			return {
				communityJourneyEnrollmentId: input.communityJourneyId,
				withdrawnAt: enrollment.lifecycle.withdrawnAt,
			};
		}
		if (enrollment.lifecycle.status === 'Started')
			throw problem(
				'failed-precondition',
				'This enrollment has already started.',
				'EnrollmentStarted',
			);
		if (enrollment.lifecycle.status === 'StartBlocked')
			throw problem(
				'failed-precondition',
				'This enrollment can no longer start.',
				'EnrollmentUnavailable',
			);
		const withdrawnAt =
			enrollment.lifecycle.status === 'Withdrawn'
				? enrollment.lifecycle.withdrawnAt
				: now;
		if (enrollment.lifecycle.status === 'Enrolled')
			transaction.update(enrollmentReference, {
				lifecycle: { status: 'Withdrawn', withdrawnAt },
				updatedAt: now,
			});
		transaction.create(operationReference, {
			requestDigest: digest(input),
			createdAt: now,
		});
		return {
			communityJourneyEnrollmentId: input.communityJourneyId,
			withdrawnAt,
		};
	});
};

export const enrollCommunityJourney = onCall(async (request) =>
	enrollCommunityJourneyForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const getCommunityJourneyEnrollment = onCall(async (request) =>
	getCommunityJourneyEnrollmentForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const withdrawCommunityJourneyEnrollment = onCall(async (request) =>
	withdrawCommunityJourneyEnrollmentForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
