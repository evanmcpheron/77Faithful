import type { IPersistedTimestamp, TCalendarDate } from '../shared/persistence.types';
import type { IJourneyDetails, JourneyStatus } from './journey.types';

export interface IJourneyRecordedCounts {
  reachedDayCount: number;
  fullyCompletedDays: number;
  practicesMarkedComplete: number;
  longestCompleteDayStreak: number;
  writtenReflectionCount: number;
  // Sum the five to seven practices assigned to each reached day, including practice changes.
  possiblePracticeMarkers: number;
}

export interface IActiveJourneyStatistics {
  status: typeof JourneyStatus.Active;
  currentCompleteDayStreak: number;
}

export interface IEndedJourneyStatistics {
  status: typeof JourneyStatus.Completed | typeof JourneyStatus.EndedEarly;
}

/** Non-authoritative: recalculated from the current record, including historical corrections. */
export type TDerivedJourneyStatistics = IJourneyRecordedCounts &
  (IActiveJourneyStatistics | IEndedJourneyStatistics);

export const JourneySummaryKind = {
  FinalDayPreview: 'FinalDayPreview',
  Completed: 'Completed',
  EndedEarly: 'EndedEarly',
} as const;

export type TJourneySummaryKind = (typeof JourneySummaryKind)[keyof typeof JourneySummaryKind];

export interface IFinalDaySummary {
  kind: typeof JourneySummaryKind.FinalDayPreview;
}

export interface ICompletedJourneySummary {
  kind: typeof JourneySummaryKind.Completed;
}

export interface IEarlyEndedJourneySummary {
  kind: typeof JourneySummaryKind.EndedEarly;
  endedOn: TCalendarDate;
}

/** Private projection, never a stored certificate or a community progress payload. */
export interface IDerivedJourneySummary {
  details: IJourneyDetails;
  ending: IFinalDaySummary | ICompletedJourneySummary | IEarlyEndedJourneySummary;
  counts: IJourneyRecordedCounts;
  calculatedAt: IPersistedTimestamp;
}
