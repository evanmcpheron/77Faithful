import type {
  IPersistedTimestamp,
  TCalendarDate,
  TIanaTimeZoneId,
} from '../shared/persistence.types';
import type { TOptionalPracticeSelection } from '../formation/practice.types';
import type { IEarlyEndedJourneyState, IJourneyDetails } from './journey.types';
import type { IJourneyPracticeSelection } from './practice-change.types';

/** Local review context, never a persisted start date or a caller-chosen schedule. */
export interface IJourneyStartReview {
  observedPhoneTimeZoneId: TIanaTimeZoneId;
  reviewedStartDate: TCalendarDate;
}

export interface IStartJourneyRequest {
  operationId: string;
  setupDraftId: string;
  expectedSetupRevision: number;
  review: IJourneyStartReview;
}

export const StartJourneyOutcome = {
  Started: 'Started',
  ExistingActiveJourney: 'ExistingActiveJourney',
  ReviewChanged: 'ReviewChanged',
} as const;

export type TStartJourneyOutcome = (typeof StartJourneyOutcome)[keyof typeof StartJourneyOutcome];

export interface IConfirmedJourneyStartResult {
  outcome: typeof StartJourneyOutcome.Started | typeof StartJourneyOutcome.ExistingActiveJourney;
  details: IJourneyDetails;
}

export interface IChangedJourneyStartReviewResult {
  outcome: typeof StartJourneyOutcome.ReviewChanged;
  review: IJourneyStartReview;
  day77Date: TCalendarDate;
}

// Validate phone zone and derive today's date on the server; stale reviews require renewed review.
export type TStartJourneyResult = IConfirmedJourneyStartResult | IChangedJourneyStartReviewResult;

export interface IEndJourneyEarlyRequest {
  operationId: string;
  journeyId: string;
}

export interface IEndJourneyEarlyResult {
  journeyId: string;
  state: IEarlyEndedJourneyState;
}

export interface IConfirmOptionalPracticeReplacementRequest {
  operationId: string;
  journeyId: string;
  expectedScheduleRevision: number;
  optionalPracticeIds: TOptionalPracticeSelection;
  // Preconditions preserve the day/date the participant reviewed across midnight.
  reviewedEffectiveDayNumber: number;
  reviewedEffectiveDate: TCalendarDate;
}

export interface IConfirmOptionalPracticeReplacementResult {
  practiceChangeId: string;
  selection: IJourneyPracticeSelection;
  confirmedAt: IPersistedTimestamp;
}

export interface ICancelOptionalPracticeReplacementRequest {
  operationId: string;
  journeyId: string;
  practiceChangeId: string;
  expectedScheduleRevision: number;
}

export interface ICancelOptionalPracticeReplacementResult {
  selection: IJourneyPracticeSelection;
}
