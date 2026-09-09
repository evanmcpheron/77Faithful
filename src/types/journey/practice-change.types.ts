import type { TOptionalPracticePair } from '../formation/practice.types';
import type {
  IDocumentTimestamps,
  IPersistedTimestamp,
  TCalendarDate,
} from '../shared/persistence.types';

export const PracticeChangeStatus = {
  Pending: 'Pending',
  Applied: 'Applied',
  Canceled: 'Canceled',
  Superseded: 'Superseded',
} as const;

export type TPracticeChangeStatus =
  (typeof PracticeChangeStatus)[keyof typeof PracticeChangeStatus];

/**
 * Private history at a practiceChangeId path, including days materialized later.
 * Pending becomes effective on its date even before Applied is persisted.
 * Cancellation/supersession is only legal before that boundary.
 */
export interface IPracticeChangeDocument extends IDocumentTimestamps {
  readonly userId: string;
  readonly journeyId: string;
  readonly optionalPracticeIds: TOptionalPracticePair;
  /** Integer 2–77: the next journey day at confirmation, never a caller-selected date. */
  readonly effectiveDayNumber: number;
  readonly effectiveDate: TCalendarDate;
  readonly confirmedAt: IPersistedTimestamp;
  readonly scheduleRevision: number;
  status: TPracticeChangeStatus;
}

export interface IPendingPracticeChange {
  practiceChangeId: string;
  optionalPracticeIds: TOptionalPracticePair;
  effectiveDayNumber: number;
  effectiveDate: TCalendarDate;
}

/** Derived from initial choices and effective change history in the fixed journey zone. */
export interface IJourneyPracticeSelection {
  journeyId: string;
  currentOptionalPracticeIds: TOptionalPracticePair;
  scheduleRevision: number;
  pendingChange: IPendingPracticeChange | null;
}
