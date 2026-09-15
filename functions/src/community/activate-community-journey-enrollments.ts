import { getAuth } from 'firebase-admin/auth';
import {
	FieldPath,
	getFirestore,
	Timestamp,
	type Firestore,
} from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
	parseRetryCommunityJourneyActivationRequest as parseCanonicalRetry,
	parseCommunityCalendarDate,
	parseCommunityTimeZoneId,
} from '../../generated/features/communities/community-journey';
import {
	addJourneyCalendarDays,
	getJourneyCalendarDate,
} from '../../generated/features/journey/journey-calendar';
import type {
	IRetryCommunityJourneyActivationResult,
	TCommunityJourneyActivationReasonCode,
} from '../../generated/types/community/community-function.types';
import type {
	ICommunityJourneyDocument,
	ICommunityJourneyEnrollmentDocument,
	TCommunityJourneyStartBlockReason,
} from '../../generated/types/community/community-journey.types';
import { BibleVersionId } from '../../generated/types/formation/bible-version.types';
import { OptionalPracticeId } from '../../generated/types/formation/practice.types';
import type { IJourneyDocument } from '../../generated/types/journey/journey.types';
import {
	requirePublishedCourse,
	writePrivateJourneyStart,
} from '../journey/start-journey';
import { safeCommunityJourneyPreview } from './community-journey';
import { requireCommunityAccount } from './read-community';

const PAGE_SIZE = 20;
const PAGES_PER_RUN = 4;
const validId = (value: unknown): value is string =>
	typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
const problem = (
	reason: TCommunityJourneyActivationReasonCode,
	code: ConstructorParameters<typeof HttpsError>[0] = 'failed-precondition',
) => new HttpsError(code, 'This enrollment cannot start.', { reason });
const digest = (value: unknown) =>
	createHash('sha256').update(JSON.stringify(value)).digest('hex');

export interface IActivationDependencies {
	database?: Firestore;
	now?: Timestamp;
	verifiedAccount?: (userId: string) => Promise<boolean | null>;
}
const verifiedAccount = async (userId: string): Promise<boolean | null> => {
	try {
		const account = await getAuth().getUser(userId);
		return account.disabled ? null : account.emailVerified;
	} catch (caught) {
		if (
			typeof caught === 'object' &&
			caught !== null &&
			'code' in caught &&
			caught.code === 'auth/user-not-found'
		)
			return null;
		throw caught;
	}
};

export const parseRetryCommunityJourneyActivationRequest = (value: unknown) => {
	try {
		return parseCanonicalRetry(value);
	} catch {
		throw problem('InvalidInput', 'invalid-argument');
	}
};

type TActivationOutcome = 'NotDue' | 'Started' | 'StartBlocked' | 'Withdrawn';
export const activateCommunityJourneyEnrollment = async (
	userId: string,
	communityId: string,
	communityJourneyId: string,
	operationId: string,
	dependencies: IActivationDependencies = {},
): Promise<TActivationOutcome> => {
	if (![userId, communityId, communityJourneyId, operationId].every(validId))
		throw problem('InvalidInput', 'invalid-argument');
	const database = dependencies.database ?? getFirestore();
	const user = database.doc(`users/${userId}`);
	const enrollmentRef = user
		.collection('communityJourneyEnrollments')
		.doc(communityJourneyId);
	const operationRef = user
		.collection('communityJourneyActivationOperations')
		.doc(operationId);
	const lockRef = user.collection('journeyControl').doc('current');
	const journeyRef = user.collection('journeys').doc();
	const scheduleRef = database.doc(
		`communities/${communityId}/communityJourneys/${communityJourneyId}`,
	);
	const communityRef = database.doc(`communities/${communityId}`);
	const memberRef = communityRef.collection('members').doc(userId);
	const requestDigest = digest({ communityId, communityJourneyId });
	return database.runTransaction(async (transaction) => {
		const now = dependencies.now ?? Timestamp.now();
		const accountVerified = await (
			dependencies.verifiedAccount ?? verifiedAccount
		)(userId);
		const [
			profile,
			enrollmentSnap,
			prior,
			community,
			member,
			schedule,
			lock,
			active,
		] = await Promise.all([
			transaction.get(user),
			transaction.get(enrollmentRef),
			transaction.get(operationRef),
			transaction.get(communityRef),
			transaction.get(memberRef),
			transaction.get(scheduleRef),
			transaction.get(lockRef),
			transaction.get(
				user
					.collection('journeys')
					.where('state.status', '==', 'Active')
					.limit(1),
			),
		]);
		void lock;
		if (prior.exists && prior.get('requestDigest') !== requestDigest)
			throw problem('OperationPayloadMismatch', 'already-exists');
		const enrollment = enrollmentSnap.data() as
			ICommunityJourneyEnrollmentDocument | undefined;
		if (
			!enrollment ||
			enrollment.schemaVersion !== 1 ||
			enrollment.userId !== userId ||
			enrollment.communityId !== communityId ||
			enrollment.communityJourneyId !== communityJourneyId ||
			!(enrollment.activationConsentConfirmedAt instanceof Timestamp) ||
			!(enrollment.createdAt instanceof Timestamp) ||
			!(enrollment.updatedAt instanceof Timestamp) ||
			!['Enrolled', 'Started', 'Withdrawn', 'StartBlocked'].includes(
				enrollment.lifecycle?.status,
			)
		)
			throw problem('EnrollmentDataUnavailable');
		try {
			parseCommunityTimeZoneId(enrollment.startingTimeZoneId);
		} catch {
			throw problem('EnrollmentDataUnavailable');
		}
		if (enrollment.lifecycle.status !== 'Enrolled')
			return enrollment.lifecycle.status === 'Withdrawn'
				? 'Withdrawn'
				: enrollment.lifecycle.status;
		const parent = schedule.data() as ICommunityJourneyDocument | undefined;
		if (
			!parent ||
			parent.schemaVersion !== 1 ||
			parent.communityId !== communityId ||
			!(parent.firstEnrollmentAcceptedAt instanceof Timestamp) ||
			enrollment.scheduleRevision !== parent.revision
		)
			throw problem('ScheduleDataUnavailable');
		try {
			parseCommunityCalendarDate(parent.startDate);
			parseCommunityTimeZoneId(parent.timeZoneId);
			safeCommunityJourneyPreview(communityJourneyId, parent, now);
		} catch {
			throw problem('ScheduleDataUnavailable');
		}
		let participantDate: string;
		try {
			participantDate = getJourneyCalendarDate(
				now.toDate(),
				enrollment.startingTimeZoneId,
			);
		} catch {
			throw problem('EnrollmentDataUnavailable');
		}
		if (participantDate < parent.startDate) return 'NotDue';
		let blockReason: TCommunityJourneyStartBlockReason | null = null;
		if (participantDate > parent.startDate) blockReason = 'MissedStartDate';
		else if (!profile.exists || accountVerified === null)
			blockReason = 'AccountUnavailable';
		else if (!accountVerified) blockReason = 'EmailVerificationRequired';
		else if (
			!member.exists ||
			member.get('lifecycle.status') !== 'Active' ||
			member.get('communityId') !== communityId ||
			member.get('userId') !== userId ||
			member.get('role') !== 'Member'
		)
			blockReason = 'MembershipEnded';
		else if (
			!community.exists ||
			community.get('lifecycle.status') !== 'Active'
		)
			blockReason = 'CommunityClosed';
		else if (
			community.get('currentCommunityJourneyId') !== communityJourneyId ||
			parent.lifecycle.status === 'Canceled'
		)
			blockReason = 'CommunityJourneyCanceled';
		else if (active.size > 0) blockReason = 'ActivePersonalJourney';
		else if (
			!Array.isArray(enrollment.optionalPracticeIds) ||
			enrollment.optionalPracticeIds.length < 2 ||
			enrollment.optionalPracticeIds.length > 4 ||
			new Set(enrollment.optionalPracticeIds).size !==
				enrollment.optionalPracticeIds.length ||
			!enrollment.optionalPracticeIds.every((id) =>
				Object.values(OptionalPracticeId).includes(id),
			) ||
			!Object.values(BibleVersionId).includes(
				enrollment.bibleVersionId,
			) ||
			enrollment.setupDraftId !== 'current' ||
			!Number.isSafeInteger(enrollment.setupRevision)
		)
			blockReason = 'SetupInvalid';
		if (blockReason) {
			transaction.update(enrollmentRef, {
				lifecycle: {
					status: 'StartBlocked',
					reason: blockReason,
					blockedAt: now,
				},
				updatedAt: now,
			});
			if (!prior.exists)
				transaction.create(operationRef, {
					requestDigest,
					createdAt: now,
				});
			return 'StartBlocked';
		}
		let course;
		try {
			course = await requirePublishedCourse(
				transaction,
				database,
				enrollment.bibleVersionId,
			);
		} catch (caught) {
			if (
				!(caught instanceof HttpsError) ||
				(caught.details as { reason?: string } | undefined)?.reason !==
					'ContentUnavailable'
			)
				throw caught;
			transaction.update(enrollmentRef, {
				lifecycle: {
					status: 'StartBlocked',
					reason: 'ContentUnavailable',
					blockedAt: now,
				},
				updatedAt: now,
			});
			if (!prior.exists)
				transaction.create(operationRef, {
					requestDigest,
					createdAt: now,
				});
			return 'StartBlocked';
		}
		if (
			course.courseId !== parent.course.courseId ||
			course.courseVersionId !== parent.course.courseVersionId
		) {
			transaction.update(enrollmentRef, {
				lifecycle: {
					status: 'StartBlocked',
					reason: 'ContentUnavailable',
					blockedAt: now,
				},
				updatedAt: now,
			});
			if (!prior.exists)
				transaction.create(operationRef, {
					requestDigest,
					createdAt: now,
				});
			return 'StartBlocked';
		}
		const motivation = enrollment.startingMotivation;
		const revision = enrollment.startingMotivationRevision;
		if (
			motivation === undefined ||
			revision === undefined ||
			(motivation !== null &&
				(!revision ||
					!validId(motivation.revisionId) ||
					!(motivation.updatedAt instanceof Timestamp) ||
					revision.userId !== userId ||
					!(revision.savedAt instanceof Timestamp) ||
					revision.text !== motivation.text ||
					revision.target.kind !== 'SetupMotivation' ||
					revision.target.setupDraftId !==
						enrollment.setupDraftId)) ||
			(motivation === null && revision !== null)
		) {
			transaction.update(enrollmentRef, {
				lifecycle: {
					status: 'StartBlocked',
					reason: 'WritingUnavailable',
					blockedAt: now,
				},
				updatedAt: now,
			});
			if (!prior.exists)
				transaction.create(operationRef, {
					requestDigest,
					createdAt: now,
				});
			return 'StartBlocked';
		}
		const preferencesRef = user.collection('preferences').doc('current');
		const preferences = (await transaction.get(preferencesRef)).data();
		const journey: IJourneyDocument = {
			schemaVersion: 1,
			userId,
			course,
			startDate: parent.startDate,
			timeZoneId: enrollment.startingTimeZoneId,
			initialOptionalPracticeIds: enrollment.optionalPracticeIds,
			practiceScheduleRevision: 0,
			state: { status: 'Active' },
			startingMotivation: motivation,
			createdAt: now,
			updatedAt: now,
		};
		writePrivateJourneyStart({
			transaction,
			userReference: user,
			journeyReference: journeyRef,
			lockReference: lockRef,
			preferencesReference: preferencesRef,
			preferences,
			journey,
			motivationRevision: revision,
			motivationHead: motivation,
			bibleVersionId: enrollment.bibleVersionId,
			now,
		});
		transaction.update(enrollmentRef, {
			lifecycle: {
				status: 'Started',
				journeyId: journeyRef.id,
				startedAt: now,
			},
			updatedAt: now,
		});
		if (!prior.exists)
			transaction.create(operationRef, { requestDigest, createdAt: now });
		return 'Started';
	});
};

export const reconcileCommunityJourneySchedule = async (
	communityId: string,
	journeyId: string,
	dependencies: IActivationDependencies = {},
) => {
	const database = dependencies.database ?? getFirestore();
	const reference = database.doc(
		`communities/${communityId}/communityJourneys/${journeyId}`,
	);
	return database.runTransaction(async (transaction) => {
		const now = dependencies.now ?? Timestamp.now();
		const snapshot = await transaction.get(reference);
		const schedule = snapshot.data() as
			ICommunityJourneyDocument | undefined;
		if (
			!schedule ||
			schedule.communityId !== communityId ||
			schedule.schemaVersion !== 1
		)
			throw problem('ScheduleDataUnavailable');
		if (
			schedule.lifecycle.status === 'Canceled' ||
			schedule.lifecycle.status === 'Completed'
		)
			return schedule.lifecycle.status;
		const today = getJourneyCalendarDate(now.toDate(), schedule.timeZoneId);
		if (today >= addJourneyCalendarDays(schedule.startDate, 77)) {
			transaction.update(reference, {
				lifecycle: { status: 'Completed', completedAt: now },
				updatedAt: now,
			});
			return 'Completed';
		}
		if (
			today >= schedule.startDate &&
			schedule.lifecycle.status === 'Scheduled'
		) {
			transaction.update(reference, {
				lifecycle: { status: 'Active', startedAt: now },
				updatedAt: now,
			});
			return 'Active';
		}
		return schedule.lifecycle.status;
	});
};

const scanPage = async (
	database: Firestore,
	collectionName: string,
	status: string[],
	cursor: string | null,
) => {
	let query = database
		.collectionGroup(collectionName)
		.where(
			'lifecycle.status',
			status.length === 1 ? '==' : 'in',
			status.length === 1 ? status[0] : status,
		)
		.orderBy(FieldPath.documentId())
		.limit(PAGE_SIZE);
	if (cursor) query = query.startAfter(database.doc(cursor));
	return query.get();
};
export const runDueCommunityJourneyBatch = async (
	dependencies: IActivationDependencies = {},
	dryRun = false,
) => {
	const database = dependencies.database ?? getFirestore();
	const checkpoint = database.doc('communityJourneyActivationWorker/current');
	const state = await checkpoint.get();
	let enrollmentCursor: string | null = state.get('enrollmentCursor') ?? null;
	let scheduleCursor: string | null = state.get('scheduleCursor') ?? null;
	const counts = { enrollments: 0, schedules: 0, failed: 0 };
	for (let page = 0; page < PAGES_PER_RUN; page++) {
		let enrollments = await scanPage(
			database,
			'communityJourneyEnrollments',
			['Enrolled'],
			enrollmentCursor,
		);
		if (enrollments.empty && enrollmentCursor) {
			enrollmentCursor = null;
			enrollments = await scanPage(
				database,
				'communityJourneyEnrollments',
				['Enrolled'],
				null,
			);
		}
		for (const snapshot of enrollments.docs) {
			const userId = snapshot.ref.parent.parent?.id;
			const communityId = snapshot.get('communityId');
			if (!validId(userId) || !validId(communityId)) {
				counts.failed++;
				continue;
			}
			try {
				if (!dryRun)
					await activateCommunityJourneyEnrollment(
						userId,
						communityId,
						snapshot.id,
						`worker-${digest({ communityId, journeyId: snapshot.id }).slice(0, 40)}`,
						dependencies,
					);
				counts.enrollments++;
			} catch {
				counts.failed++;
			}
		}
		if (!enrollments.empty)
			enrollmentCursor =
				enrollments.docs[enrollments.docs.length - 1].ref.path;
		if (enrollments.size < PAGE_SIZE) break;
	}
	for (let page = 0; page < PAGES_PER_RUN; page++) {
		let schedules = await scanPage(
			database,
			'communityJourneys',
			['Scheduled', 'Active'],
			scheduleCursor,
		);
		if (schedules.empty && scheduleCursor) {
			scheduleCursor = null;
			schedules = await scanPage(
				database,
				'communityJourneys',
				['Scheduled', 'Active'],
				null,
			);
		}
		for (const snapshot of schedules.docs) {
			const communityId = snapshot.ref.parent.parent?.id;
			if (!validId(communityId)) {
				counts.failed++;
				continue;
			}
			try {
				if (!dryRun)
					await reconcileCommunityJourneySchedule(
						communityId,
						snapshot.id,
						dependencies,
					);
				counts.schedules++;
			} catch {
				counts.failed++;
			}
		}
		if (!schedules.empty)
			scheduleCursor = schedules.docs[schedules.docs.length - 1].ref.path;
		if (schedules.size < PAGE_SIZE) break;
	}
	if (!dryRun)
		await checkpoint.set({
			enrollmentCursor,
			scheduleCursor,
			updatedAt: Timestamp.now(),
			failedInLastRun: counts.failed,
		});
	return counts;
};

export const retryCommunityJourneyActivation = onCall(async (request) => {
	const userId = requireCommunityAccount(request.auth);
	const input = parseRetryCommunityJourneyActivationRequest(request.data);
	const outcome = await activateCommunityJourneyEnrollment(
		userId,
		input.communityId,
		input.communityJourneyId,
		input.operationId,
	);
	return { outcome } satisfies IRetryCommunityJourneyActivationResult;
});
