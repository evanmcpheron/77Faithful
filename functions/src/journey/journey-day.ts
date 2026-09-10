import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import {
	addJourneyCalendarDays,
	getJourneyCalendarDate,
	getJourneyDayNumber,
} from '../../generated/features/journey/journey-calendar';
import type {
	IGetJourneyDayRequest,
	IJourneyDaySession,
} from '../../generated/features/journey/journey-day-session.types';
import type {
	IUserPreferencesDocument,
	IUserProfileDocument,
} from '../../generated/types/account/user.types';
import type { IBibleTextEditionDocument } from '../../generated/types/formation/bible-version.types';
import { BibleVersion } from '../../generated/types/formation/bible-version.types';
import type {
	IFormationCourseVersionDocument,
	IFormationDayContentDocument,
	IFormationWeekIntroductionDocument,
	IFormationWeekOverviewDocument,
} from '../../generated/types/formation/formation-course.types';
import type { TOptionalPracticeSelection } from '../../generated/types/formation/practice.types';
import type {
	IScriptureAssignmentDocument,
	IScriptureAssignmentTextDocument,
} from '../../generated/types/formation/scripture.types';
import type {
	IJourneyDayDocument,
	IPracticeCompletion,
	TAssignedOptionalPractices,
} from '../../generated/types/journey/journey-day.types';
import type { IJourneyDocument } from '../../generated/types/journey/journey.types';
import type { IPracticeChangeDocument } from '../../generated/types/journey/practice-change.types';
import type { IPersistedTimestamp } from '../../generated/types/shared/persistence.types';

const initialCompletion = (): IPracticeCompletion => ({
	status: 'NotMarked',
	revision: 0,
	updatedAt: null,
});

const assignOptionalPractices = (
	practiceIds: TOptionalPracticeSelection,
): TAssignedOptionalPractices => {
	const assign = (practiceId: TOptionalPracticeSelection[number]) => ({
		practiceId,
		completion: initialCompletion(),
	});
	if (practiceIds.length === 4)
		return [
			assign(practiceIds[0]),
			assign(practiceIds[1]),
			assign(practiceIds[2]),
			assign(practiceIds[3]),
		];
	if (practiceIds.length === 3)
		return [
			assign(practiceIds[0]),
			assign(practiceIds[1]),
			assign(practiceIds[2]),
		];
	return [assign(practiceIds[0]), assign(practiceIds[1])];
};

export const serializeTimestamp = (
	timestamp: IPersistedTimestamp,
): IPersistedTimestamp => ({
	seconds: timestamp.seconds,
	nanoseconds: timestamp.nanoseconds,
});

const serializeCompletion = (
	completion: IPracticeCompletion,
): IPracticeCompletion => ({
	...completion,
	updatedAt: completion.updatedAt
		? serializeTimestamp(completion.updatedAt)
		: null,
});

const serializeDay = (day: IJourneyDayDocument): IJourneyDayDocument => {
	const assigned = day.practices.optionalPractices;
	const serializeOptional = (
		practice: TAssignedOptionalPractices[number],
	) => ({
		practiceId: practice.practiceId,
		completion: serializeCompletion(practice.completion),
	});
	const optionalPractices: TAssignedOptionalPractices =
		assigned.length === 4
			? [
					serializeOptional(assigned[0]),
					serializeOptional(assigned[1]),
					serializeOptional(assigned[2]),
					serializeOptional(assigned[3]),
				]
			: assigned.length === 3
				? [
						serializeOptional(assigned[0]),
						serializeOptional(assigned[1]),
						serializeOptional(assigned[2]),
					]
				: [
						serializeOptional(assigned[0]),
						serializeOptional(assigned[1]),
					];
	return {
		...day,
		practices: {
			readScripture: serializeCompletion(day.practices.readScripture),
			pray: serializeCompletion(day.practices.pray),
			reflect: serializeCompletion(day.practices.reflect),
			optionalPractices,
		},
		intention: day.intention
			? {
					...day.intention,
					updatedAt: serializeTimestamp(day.intention.updatedAt),
				}
			: null,
		reflection: day.reflection
			? {
					...day.reflection,
					updatedAt: serializeTimestamp(day.reflection.updatedAt),
				}
			: null,
		lastParticipantUpdateAt: day.lastParticipantUpdateAt
			? serializeTimestamp(day.lastParticipantUpdateAt)
			: null,
		createdAt: serializeTimestamp(day.createdAt),
		updatedAt: serializeTimestamp(day.updatedAt),
	};
};

export const readJourneyDay = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	request: IGetJourneyDayRequest,
) => {
	const journeyReference = database.doc(
		`users/${userId}/journeys/${request.journeyId}`,
	);
	const journey = (await transaction.get(journeyReference)).data() as
		IJourneyDocument | undefined;
	if (!journey || journey.userId !== userId)
		throw new HttpsError('not-found', 'This journey isn’t available.');
	const today = getJourneyCalendarDate(
		new Date(),
		request.observedPhoneTimeZoneId,
	);
	const lastReachedDay =
		journey.state.status === 'EndedEarly'
			? journey.state.lastReachedDayNumber
			: journey.state.status === 'Completed'
				? 77
				: Math.min(77, getJourneyDayNumber(journey.startDate, today));
	if (request.dayNumber > lastReachedDay)
		throw new HttpsError(
			'failed-precondition',
			'This day hasn’t begun yet.',
		);
	const dayReference = journeyReference
		.collection('days')
		.doc(String(request.dayNumber));
	const existingDay = (await transaction.get(dayReference)).data() as
		IJourneyDayDocument | undefined;
	const versionReference = database.doc(
		`formationCourses/${journey.course.courseId}/versions/${journey.course.courseVersionId}`,
	);
	const version = (await transaction.get(versionReference)).data() as
		IFormationCourseVersionDocument | undefined;
	if (version?.publicationState.status !== 'Published')
		throw new HttpsError(
			'unavailable',
			'Today’s guidance isn’t available right now. Please try again later.',
		);
	const dayContentId =
		existingDay?.content.dayContentId ?? String(request.dayNumber);
	const content = (
		await transaction.get(
			versionReference.collection('days').doc(dayContentId),
		)
	).data() as IFormationDayContentDocument | undefined;
	if (
		!content ||
		content.dayNumber !== request.dayNumber ||
		content.courseId !== journey.course.courseId ||
		content.courseVersionId !== journey.course.courseVersionId
	) {
		throw new HttpsError(
			'unavailable',
			'We couldn’t load this day’s guidance. Please try again.',
		);
	}
	let optionalPracticeIds = journey.initialOptionalPracticeIds;
	if (!existingDay && journey.practiceScheduleRevision > 0) {
		const changes = await transaction.get(
			journeyReference.collection('practiceChanges'),
		);
		const effectiveChanges = changes.docs
			.map((snapshot) => snapshot.data() as IPracticeChangeDocument)
			.filter(
				(change) =>
					change.effectiveDayNumber <= request.dayNumber &&
					(change.status === 'Pending' ||
						change.status === 'Applied'),
			)
			.sort(
				(left, right) => right.scheduleRevision - left.scheduleRevision,
			);
		optionalPracticeIds =
			effectiveChanges[0]?.optionalPracticeIds ?? optionalPracticeIds;
	}
	const now = Timestamp.now();
	const day: IJourneyDayDocument = existingDay ?? {
		schemaVersion: 1,
		userId,
		journeyId: request.journeyId,
		dayNumber: request.dayNumber,
		calendarDate: addJourneyCalendarDays(
			journey.startDate,
			request.dayNumber - 1,
		),
		content: { ...journey.course, dayContentId },
		weekNumber: content.weekNumber,
		themeId: content.themeId,
		practices: {
			readScripture: initialCompletion(),
			pray: initialCompletion(),
			reflect: initialCompletion(),
			optionalPractices: assignOptionalPractices(optionalPracticeIds),
		},
		intention: null,
		reflection: null,
		lastParticipantUpdateAt: null,
		createdAt: now,
		updatedAt: now,
	};
	return {
		day,
		content,
		dayReference,
		versionReference,
		isNew: !existingDay,
	};
};

export const getJourneyDayForAccount = async (
	userId: string,
	request: IGetJourneyDayRequest,
	database = getFirestore(),
): Promise<IJourneyDaySession> => {
	return database.runTransaction(async (transaction) => {
		const { day, content, dayReference, versionReference, isNew } =
			await readJourneyDay(transaction, database, userId, request);
		const profile = (
			await transaction.get(database.doc(`users/${userId}`))
		).data() as IUserProfileDocument | undefined;
		const preferences = (
			await transaction.get(
				database.doc(`users/${userId}/preferences/current`),
			)
		).data() as IUserPreferencesDocument | undefined;
		const translation = Object.values(BibleVersion).find(
			(version) => version.bibleVersionId === preferences?.bibleVersionId,
		);
		if (!translation)
			throw new HttpsError(
				'failed-precondition',
				'Choose a Bible translation in Settings.',
			);
		const overview = (
			await transaction.get(
				versionReference
					.collection('weekOverviews')
					.doc(String(day.weekNumber)),
			)
		).data() as IFormationWeekOverviewDocument | undefined;
		const introduction = (
			await transaction.get(
				versionReference
					.collection('weekIntroductions')
					.doc(String(day.weekNumber)),
			)
		).data() as IFormationWeekIntroductionDocument | undefined;
		if (!overview || !introduction)
			throw new HttpsError(
				'unavailable',
				'We couldn’t load this week’s introduction. Please try again.',
			);
		const configuration = (
			await transaction.get(
				database.doc('formationConfiguration/current'),
			)
		).data();
		const editionId: unknown =
			configuration?.bibleTextEditionIds?.[translation.bibleVersionId];
		const assignment = (
			await transaction.get(
				database.doc(
					`scriptureAssignments/${content.scriptureAssignmentId}`,
				),
			)
		).data() as IScriptureAssignmentDocument | undefined;
		if (!assignment)
			throw new HttpsError(
				'unavailable',
				'We couldn’t load the assigned reading. Please try again.',
			);
		let scripture: IScriptureAssignmentTextDocument | null = null;
		let acknowledgments: readonly string[] = [];
		if (
			typeof editionId === 'string' &&
			/^[a-zA-Z0-9_-]{1,128}$/.test(editionId)
		) {
			const editionReference = database.doc(
				`bibleTextEditions/${editionId}`,
			);
			const edition = (await transaction.get(editionReference)).data() as
				IBibleTextEditionDocument | undefined;
			const reading = (
				await transaction.get(
					editionReference
						.collection('assignmentTexts')
						.doc(content.scriptureAssignmentId),
				)
			).data() as IScriptureAssignmentTextDocument | undefined;
			if (
				edition?.releaseState.status === 'Released' &&
				edition.bibleVersionId === translation.bibleVersionId &&
				reading?.bibleVersionId === translation.bibleVersionId &&
				reading.bibleTextEditionId === editionId &&
				reading.scriptureAssignmentId ===
					content.scriptureAssignmentId &&
				assignment &&
				reading.primaryPassage.passageId ===
					assignment.primaryPassage.passageId &&
				(assignment.supportingPassage
					? reading.supportingPassage?.passageId ===
						assignment.supportingPassage.passageId
					: reading.supportingPassage === null)
			) {
				scripture = {
					...reading,
					createdAt: serializeTimestamp(reading.createdAt),
					updatedAt: serializeTimestamp(reading.updatedAt),
				};
				acknowledgments = edition.acknowledgments;
			}
		}
		if (isNew) transaction.create(dayReference, day);
		return {
			day: serializeDay(day),
			content,
			scripture,
			scriptureReference: assignment.displayReference,
			translation,
			acknowledgments,
			scriptureAvailabilityMessage: scripture
				? null
				: `The full passage isn’t available in ${translation.abbreviation} right now. Please try again later.`,
			week: { ...overview, ...introduction },
			preferredName: profile?.preferredName ?? null,
		};
	});
};
