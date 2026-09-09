import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import type { IJourneySetupDraftDocument } from '../../generated/types/account/journey-setup.types';
import { BibleVersionId } from '../../generated/types/formation/bible-version.types';
import { FormationThemeOrder } from '../../generated/types/formation/formation-course.types';
import { OptionalPracticeId } from '../../generated/types/formation/practice.types';
import type {
  IStartJourneyRequest,
  TStartJourneyResult,
} from '../../generated/types/journey/journey-function.types';
import type { IWritingRevisionDocument } from '../../generated/types/journey/journey-writing.types';
import type {
  IJourneyDocument,
  IJourneyDetails,
} from '../../generated/types/journey/journey.types';
import {
  addJourneyCalendarDays,
  getJourneyCalendarDate,
  getJourneyEndTime,
} from '../../generated/features/journey/journey-calendar';

const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === 'object' && input !== null && !Array.isArray(input);
const hasKeys = (input: Record<string, unknown>, keys: string[]): boolean =>
  Object.keys(input).length === keys.length && keys.every((key) => key in input);
const isId = (input: unknown): input is string =>
  typeof input === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(input);
const hasText = (input: unknown): input is string =>
  typeof input === 'string' && input.trim().length > 0;

export const parseStartJourneyRequest = (input: unknown): IStartJourneyRequest => {
  if (
    !isRecord(input) ||
    !hasKeys(input, ['operationId', 'setupDraftId', 'expectedSetupRevision', 'review']) ||
    !isId(input.operationId) ||
    input.setupDraftId !== 'current' ||
    !Number.isSafeInteger(input.expectedSetupRevision) ||
    typeof input.expectedSetupRevision !== 'number' ||
    input.expectedSetupRevision < 0 ||
    !isRecord(input.review) ||
    !hasKeys(input.review, ['observedPhoneTimeZoneId', 'reviewedStartDate']) ||
    typeof input.review.observedPhoneTimeZoneId !== 'string' ||
    input.review.observedPhoneTimeZoneId.length > 100 ||
    /^[+-]/.test(input.review.observedPhoneTimeZoneId) ||
    typeof input.review.reviewedStartDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.review.reviewedStartDate)
  ) {
    throw new HttpsError('invalid-argument', 'Review your setup before starting.');
  }
  try {
    getJourneyCalendarDate(new Date(), input.review.observedPhoneTimeZoneId);
    const reviewedDate = new Date(`${input.review.reviewedStartDate}T12:00:00Z`);
    if (getJourneyCalendarDate(reviewedDate, 'UTC') !== input.review.reviewedStartDate)
      throw new Error('Invalid date');
  } catch {
    throw new HttpsError(
      'invalid-argument',
      'Check your phone’s date and time, then review your setup.',
    );
  }
  return {
    operationId: input.operationId,
    setupDraftId: input.setupDraftId,
    expectedSetupRevision: input.expectedSetupRevision,
    review: {
      observedPhoneTimeZoneId: input.review.observedPhoneTimeZoneId,
      reviewedStartDate: input.review
        .reviewedStartDate as IStartJourneyRequest['review']['reviewedStartDate'],
    },
  };
};

const requirePublishedCourse = async (
  transaction: Transaction,
  database: Firestore,
  bibleVersionId: string,
) => {
  const configuration = (
    await transaction.get(database.doc('formationConfiguration/current'))
  ).data();
  const courseId: unknown = configuration?.courseId;
  const courseVersionId: unknown = configuration?.courseVersionId;
  const editionId: unknown = configuration?.bibleTextEditionIds?.[bibleVersionId];
  const unavailable = () =>
    new HttpsError(
      'failed-precondition',
      'The daily readings for your selected translation aren’t ready yet. Your setup is saved. Please try again later.',
      { reason: 'ContentUnavailable' },
    );
  if (!isId(courseId) || !isId(courseVersionId) || !isId(editionId)) throw unavailable();
  const versionReference = database.doc(`formationCourses/${courseId}/versions/${courseVersionId}`);
  const version = (await transaction.get(versionReference)).data();
  const edition = (await transaction.get(database.doc(`bibleTextEditions/${editionId}`))).data();
  if (
    version?.publicationState?.status !== 'Published' ||
    version.courseId !== courseId ||
    version.dayCount !== 77 ||
    version.weekCount !== 11 ||
    edition?.releaseState?.status !== 'Released' ||
    edition.bibleVersionId !== bibleVersionId ||
    !hasText(edition.editionName) ||
    !hasText(edition.sourceRevision) ||
    !Array.isArray(edition.acknowledgments) ||
    !edition.acknowledgments.length
  )
    throw unavailable();
  const days = await transaction.get(versionReference.collection('days'));
  const introductions = await transaction.get(versionReference.collection('weekIntroductions'));
  if (days.size !== 77 || introductions.size !== 11) throw unavailable();
  const dayNumbers = new Set<number>();
  for (const snapshot of days.docs) {
    const day = snapshot.data();
    const weekNumber = Math.ceil(day.dayNumber / 7);
    if (
      !Number.isInteger(day.dayNumber) ||
      day.dayNumber < 1 ||
      day.dayNumber > 77 ||
      dayNumbers.has(day.dayNumber) ||
      day.courseId !== courseId ||
      day.courseVersionId !== courseVersionId ||
      day.weekNumber !== weekNumber ||
      day.themeId !== FormationThemeOrder[weekNumber - 1] ||
      ![
        day.title,
        day.devotional,
        day.prayerPrompt,
        day.writtenPrayer,
        day.reflectionQuestion,
      ].every(hasText) ||
      !isId(day.scriptureAssignmentId)
    )
      throw unavailable();
    dayNumbers.add(day.dayNumber);
    const assignment = (
      await transaction.get(database.doc(`scriptureAssignments/${day.scriptureAssignmentId}`))
    ).data();
    const reading = (
      await transaction.get(
        database.doc(`bibleTextEditions/${editionId}/assignmentTexts/${day.scriptureAssignmentId}`),
      )
    ).data();
    const isPassageReady = (passage: unknown, passageId: unknown): boolean => {
      if (
        !isRecord(passage) ||
        passage.passageId !== passageId ||
        !hasText(passage.displayReference) ||
        !Array.isArray(passage.paragraphs) ||
        passage.paragraphs.length === 0
      )
        return false;
      return passage.paragraphs.every(
        (paragraph: unknown) =>
          isRecord(paragraph) &&
          Array.isArray(paragraph.runs) &&
          paragraph.runs.length > 0 &&
          paragraph.runs.every((run: unknown) => isRecord(run) && hasText(run.text)),
      );
    };
    if (
      !assignment ||
      !hasText(assignment.displayReference) ||
      !reading ||
      reading.bibleVersionId !== bibleVersionId ||
      reading.bibleTextEditionId !== editionId ||
      reading.scriptureAssignmentId !== day.scriptureAssignmentId ||
      !isPassageReady(reading.primaryPassage, assignment.primaryPassage?.passageId) ||
      (assignment.supportingPassage
        ? !isPassageReady(reading.supportingPassage, assignment.supportingPassage.passageId)
        : reading.supportingPassage !== null)
    )
      throw unavailable();
  }
  const weekNumbers = new Set<number>();
  for (const snapshot of introductions.docs) {
    const week = snapshot.data();
    if (
      !Number.isInteger(week.weekNumber) ||
      week.weekNumber < 1 ||
      week.weekNumber > 11 ||
      weekNumbers.has(week.weekNumber) ||
      week.courseId !== courseId ||
      week.courseVersionId !== courseVersionId ||
      week.themeId !== FormationThemeOrder[week.weekNumber - 1] ||
      !hasText(week.introduction)
    )
      throw unavailable();
    weekNumbers.add(week.weekNumber);
  }
  return { courseId, courseVersionId };
};

const getDetails = (journeyId: string, journey: IJourneyDocument): IJourneyDetails => ({
  journeyId,
  journey: {
    schemaVersion: journey.schemaVersion,
    userId: journey.userId,
    course: { courseId: journey.course.courseId, courseVersionId: journey.course.courseVersionId },
    startDate: journey.startDate,
    timeZoneId: journey.timeZoneId,
    initialOptionalPracticeIds: journey.initialOptionalPracticeIds,
    practiceScheduleRevision: journey.practiceScheduleRevision,
    state: journey.state,
    startingMotivation: journey.startingMotivation
      ? {
          revisionId: journey.startingMotivation.revisionId,
          text: journey.startingMotivation.text,
          updatedAt: {
            seconds: journey.startingMotivation.updatedAt.seconds,
            nanoseconds: journey.startingMotivation.updatedAt.nanoseconds,
          },
        }
      : null,
    createdAt: { seconds: journey.createdAt.seconds, nanoseconds: journey.createdAt.nanoseconds },
    updatedAt: { seconds: journey.updatedAt.seconds, nanoseconds: journey.updatedAt.nanoseconds },
  },
  day77Date: addJourneyCalendarDays(journey.startDate, 76),
});

export const startJourneyForAccount = async (
  userId: string,
  input: IStartJourneyRequest,
  database = getFirestore(),
): Promise<TStartJourneyResult> => {
  const userReference = database.doc(`users/${userId}`);
  const operationReference = userReference
    .collection('journeyStartOperations')
    .doc(input.operationId);
  const lockReference = userReference.collection('journeyControl').doc('current');
  const journeyReference = userReference.collection('journeys').doc();
  return database.runTransaction(async (transaction) => {
    const profile = await transaction.get(userReference);
    if (!profile.exists)
      throw new HttpsError(
        'failed-precondition',
        'Your account is unavailable. Please sign in again.',
      );
    const operation = await transaction.get(operationReference);
    if (operation.exists) return operation.data()!.result as TStartJourneyResult;
    // Every start reads and writes this document, serializing starts across devices.
    await transaction.get(lockReference);
    const existingJourneys = await transaction.get(
      userReference.collection('journeys').where('state.status', '==', 'Active').limit(1),
    );
    const existing = existingJourneys.docs[0];
    const existingJourney = existing?.data() as IJourneyDocument | undefined;
    const completedAt = existingJourney
      ? getJourneyEndTime(existingJourney.startDate, input.review.observedPhoneTimeZoneId)
      : null;
    if (existingJourney && completedAt !== null && Date.now() < completedAt) {
      const result: TStartJourneyResult = {
        outcome: 'ExistingActiveJourney',
        details: getDetails(existing.id, existingJourney),
      };
      transaction.set(operationReference, { result });
      return result;
    }
    const draftSnapshot = await transaction.get(
      userReference.collection('journeySetupDrafts').doc(input.setupDraftId),
    );
    const draft = draftSnapshot.data() as IJourneySetupDraftDocument | undefined;
    if (!draft || draft.userId !== userId || draft.revision !== input.expectedSetupRevision)
      throw new HttpsError(
        'failed-precondition',
        'Your setup changed. Load your saved setup and review it before starting.',
        { reason: 'SetupChanged' },
      );
    if (
      draft.currentStep !== 'Review' ||
      draft.choices.readiness !== 'ReadyForReview' ||
      draft.choices.optionalPracticeIds.length < 2 ||
      draft.choices.optionalPracticeIds.length > 4 ||
      new Set(draft.choices.optionalPracticeIds).size !==
        draft.choices.optionalPracticeIds.length ||
      !draft.choices.optionalPracticeIds.every((practiceId) =>
        Object.values(OptionalPracticeId).includes(practiceId),
      ) ||
      !Object.values(BibleVersionId).includes(draft.choices.bibleVersionId)
    )
      throw new HttpsError(
        'failed-precondition',
        'Review your practices and Bible translation before starting.',
      );
    const course = await requirePublishedCourse(
      transaction,
      database,
      draft.choices.bibleVersionId,
    );
    const now = Timestamp.now();
    const startDate = getJourneyCalendarDate(now.toDate(), input.review.observedPhoneTimeZoneId);
    if (startDate !== input.review.reviewedStartDate)
      return {
        outcome: 'ReviewChanged',
        review: {
          observedPhoneTimeZoneId: input.review.observedPhoneTimeZoneId,
          reviewedStartDate: startDate,
        },
        day77Date: addJourneyCalendarDays(startDate, 76),
      };
    const motivationRevision = draft.startingMotivation
      ? ((
          await transaction.get(
            userReference
              .collection('journeySetupDrafts')
              .doc(input.setupDraftId)
              .collection('writingRevisions')
              .doc(draft.startingMotivation.revisionId),
          )
        ).data() as IWritingRevisionDocument | undefined)
      : null;
    if (
      draft.startingMotivation &&
      (!motivationRevision ||
        motivationRevision.text !== draft.startingMotivation.text ||
        motivationRevision.userId !== userId)
    )
      throw new HttpsError(
        'failed-precondition',
        'Your starting motivation couldn’t be loaded. Review your saved setup and try again.',
      );
    const preferencesReference = userReference.collection('preferences').doc('current');
    const preferences = (await transaction.get(preferencesReference)).data();
    const journey: IJourneyDocument = {
      schemaVersion: 1,
      userId,
      course,
      startDate,
      timeZoneId: input.review.observedPhoneTimeZoneId,
      initialOptionalPracticeIds: draft.choices.optionalPracticeIds,
      practiceScheduleRevision: 0,
      state: { status: 'Active' },
      startingMotivation: draft.startingMotivation,
      createdAt: now,
      updatedAt: now,
    };
    const result: TStartJourneyResult = {
      outcome: 'Started',
      details: getDetails(journeyReference.id, journey),
    };
    if (existing && completedAt !== null) {
      transaction.update(existing.ref, {
        state: { status: 'Completed', completedAt: Timestamp.fromMillis(completedAt) },
        updatedAt: now,
      });
    }
    transaction.create(journeyReference, journey);
    if (motivationRevision && draft.startingMotivation) {
      const startingRevision: IWritingRevisionDocument = {
        userId,
        target: { kind: 'StartingMotivation', journeyId: journeyReference.id },
        baseRevisionId: null,
        text: motivationRevision.text,
        origin: motivationRevision.origin,
        savedAt: motivationRevision.savedAt,
      };
      transaction.create(
        journeyReference.collection('writingRevisions').doc(draft.startingMotivation.revisionId),
        startingRevision,
      );
    }
    transaction.set(preferencesReference, {
      schemaVersion: 1,
      revision: (preferences?.revision ?? -1) + 1,
      bibleVersionId: draft.choices.bibleVersionId,
      appearance: preferences?.appearance ?? 'System',
      textSizeMultiplier: preferences?.textSizeMultiplier ?? 1,
      createdAt: preferences?.createdAt ?? now,
      updatedAt: now,
    });
    transaction.set(lockReference, { journeyId: journeyReference.id });
    transaction.create(operationReference, { result });
    // Retain the draft and its revision history as the source of the starting motivation.
    return result;
  });
};
