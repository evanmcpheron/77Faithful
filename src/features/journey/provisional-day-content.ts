import manuscript from '../../../content/provisional-course/manuscript.json';
import scripture from '../../../content/provisional-course/scripture-web.json';
import type { IFormationDayContentDocument } from '@77/types/formation/formation-course.types';
import { FormationThemeOrder } from '@77/types/formation/formation-course.types';
import { BibleVersion } from '@77/types/formation/bible-version.types';
import type { IScriptureTextRun } from '@77/types/formation/scripture.types';
import type { TAssignedOptionalPractices } from '@77/types/journey/journey-day.types';
import type { TOptionalPracticeId } from '@77/types/formation/practice.types';

import { addJourneyCalendarDays } from './journey-calendar';
import type { IJourneyDaySession } from './journey-day-session.types';
import type { TTodayJourney } from './today-screen.component';

export type TProvisionalDayContent = Pick<
  IFormationDayContentDocument,
  'dayNumber' | 'title' | 'prayerPrompt' | 'writtenPrayer' | 'reflectionQuestion'
> & { passage: string };

export const getProvisionalDayContent = (
  dayNumber: number | null,
): TProvisionalDayContent | null => {
  if (dayNumber === null || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 77) {
    return null;
  }
  return manuscript.days.find((day) => day.dayNumber === dayNumber) ?? null;
};

export const getPreviewDaySession = (
  userId: string,
  journey: TTodayJourney,
  dayNumber: number,
): IJourneyDaySession | undefined => {
  const draft = manuscript.days.find((day) => day.dayNumber === dayNumber);
  const week = manuscript.weeks.find((week) => week.weekNumber === Math.ceil(dayNumber / 7));
  if (!draft || !week) return undefined;
  const readings: Record<string, readonly IScriptureTextRun[]> = scripture.readings;
  const [firstRun, ...remainingRuns] = readings[draft.passage] ?? [];
  if (!firstRun) return undefined;
  const completion = () => ({ status: 'NotMarked' as const, revision: 0, updatedAt: null });
  const assign = (practiceId: TOptionalPracticeId) => ({ practiceId, completion: completion() });
  const selected = journey.initialOptionalPracticeIds;
  const optionalPractices: TAssignedOptionalPractices =
    selected.length === 4
      ? [assign(selected[0]), assign(selected[1]), assign(selected[2]), assign(selected[3])]
      : selected.length === 3
        ? [assign(selected[0]), assign(selected[1]), assign(selected[2])]
        : [assign(selected[0]), assign(selected[1])];
  const course = { courseId: 'preview', courseVersionId: 'preview' };
  const timestamps = {
    createdAt: { seconds: 0, nanoseconds: 0 },
    updatedAt: { seconds: 0, nanoseconds: 0 },
  };
  const themeId = FormationThemeOrder[week.weekNumber - 1];
  return {
    day: {
      schemaVersion: 1,
      userId,
      journeyId: 'preview',
      dayNumber,
      calendarDate: addJourneyCalendarDays(journey.startDate, dayNumber - 1),
      content: { ...course, dayContentId: String(dayNumber) },
      weekNumber: week.weekNumber,
      themeId,
      practices: {
        readScripture: completion(),
        pray: completion(),
        reflect: completion(),
        optionalPractices,
      },
      intention: null,
      reflection: null,
      lastParticipantUpdateAt: null,
      ...timestamps,
    },
    content: {
      ...course,
      dayNumber,
      weekNumber: week.weekNumber,
      themeId,
      title: draft.title,
      scriptureAssignmentId: String(dayNumber),
      devotional: draft.devotional,
      prayerPrompt: draft.prayerPrompt,
      writtenPrayer: draft.writtenPrayer,
      reflectionQuestion: draft.reflectionQuestion,
      intentionInvitation: draft.intentionInvitation,
    },
    scripture: {
      scriptureAssignmentId: String(dayNumber),
      bibleVersionId: 'Web',
      bibleTextEditionId: 'preview-web',
      primaryPassage: {
        passageId: String(dayNumber),
        displayReference: draft.passage,
        paragraphs: [{ runs: [firstRun, ...remainingRuns] }],
        versificationNote: null,
      },
      supportingPassage: null,
      ...timestamps,
    },
    scriptureReference: draft.passage,
    scriptureAvailabilityMessage: null,
    translation: BibleVersion.WorldEnglishBible,
    acknowledgments: scripture.acknowledgments,
    week: { ...course, ...week, themeId },
    preferredName: null,
  };
};
