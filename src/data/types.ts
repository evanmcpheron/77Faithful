import type { CalendarDate, JourneyTimeZone } from '@/journey/calendar';
import type {
  OptionalPracticeId,
  OptionalPracticeSelection,
  PracticeSchedule,
} from '@/journey/practices';
import type { JourneyDayNumber } from '@/journey/invariants';
import type { TranslationId } from '@/content/scripture/translations';
import type { PracticeCompletion } from '@/journey/participation';

export type ParticipantProfile = {
  readonly userId: string;
  readonly onboardingOverviewCompleted: boolean;
  readonly optionalPractices: OptionalPracticeSelection | null;
  readonly translationId: TranslationId | null;
};

export type JourneyRecord = {
  readonly journeyId: string;
  readonly startDate: CalendarDate;
  readonly timeZone: JourneyTimeZone;
  readonly contentVersion: string;
  readonly practiceSchedule: PracticeSchedule;
};

export type DailyEntryRecord = {
  readonly id: string;
  readonly journeyId: string;
  readonly day: JourneyDayNumber;
  readonly practiceCatalogVersion: 'v1';
  readonly optionalPractices: readonly [OptionalPracticeId, OptionalPracticeId];
  readonly completion: PracticeCompletion;
  readonly morningIntention: string;
  readonly reflectionText: string;
};

export type ProfileDraftUpdate = {
  readonly onboardingOverviewCompleted?: boolean;
  readonly optionalPracticeAId?: OptionalPracticeId | null;
  readonly optionalPracticeBId?: OptionalPracticeId | null;
  readonly translationId?: TranslationId | null;
};

export type DailyEntryUpdate = Partial<PracticeCompletion> & {
  readonly morningIntention?: string | null;
  readonly reflectionText?: string | null;
};

export type DataErrorCode = 'unauthorized' | 'notFound' | 'conflict' | 'retryable' | 'invalid';

export class DataServiceError extends Error {
  constructor(readonly code: DataErrorCode) {
    super(code);
    this.name = 'DataServiceError';
  }
}
