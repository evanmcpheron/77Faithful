import type { IFormationCourseReference } from '../formation/formation-course.types';
import type { TOptionalPracticePair } from '../formation/practice.types';
import type {
  IDocumentTimestamps,
  IPersistedTimestamp,
  TCalendarDate,
  TDomainSchemaVersion,
  TIanaTimeZoneId,
} from '../shared/persistence.types';
import type { IWritingHead } from './journey-writing.types';

export const JourneyStatus = {
  Active: 'Active',
  Completed: 'Completed',
  EndedEarly: 'EndedEarly',
} as const;

export type TJourneyStatus = (typeof JourneyStatus)[keyof typeof JourneyStatus];

export interface IActiveJourneyState {
  status: typeof JourneyStatus.Active;
}

export interface ICompletedJourneyState {
  status: typeof JourneyStatus.Completed;
  // The instant after Day 77 ends, even when the server recognizes it much later.
  completedAt: IPersistedTimestamp;
}

export interface IEarlyEndedJourneyState {
  status: typeof JourneyStatus.EndedEarly;
  endedAt: IPersistedTimestamp;
  endedOn: TCalendarDate;
  /** Integer 1–77, frozen at the connected early-ending confirmation. */
  lastReachedDayNumber: number;
}

export type TJourneyState = IActiveJourneyState | ICompletedJourneyState | IEarlyEndedJourneyState;

/** Private body at a journeyId path. A setup or future enrollment is never this record. */
export interface IJourneyDocument extends IDocumentTimestamps {
  readonly schemaVersion: TDomainSchemaVersion;
  readonly userId: string;
  readonly course: IFormationCourseReference;
  readonly startDate: TCalendarDate;
  readonly timeZoneId: TIanaTimeZoneId;
  readonly initialOptionalPracticeIds: TOptionalPracticePair;
  // Used with the separate change history to reject stale practice replacements.
  practiceScheduleRevision: number;
  state: TJourneyState;
  startingMotivation: IWritingHead | null;
}

/** Private hydrated result, including the path ID and calculated Day 77 date. */
export interface IJourneyDetails {
  journeyId: string;
  journey: IJourneyDocument;
  day77Date: TCalendarDate;
}

export const JourneyPositionKind = {
  ActiveDay: 'ActiveDay',
  Completed: 'Completed',
  EndedEarly: 'EndedEarly',
} as const;

export type TJourneyPositionKind = (typeof JourneyPositionKind)[keyof typeof JourneyPositionKind];

export interface IActiveJourneyPosition {
  kind: typeof JourneyPositionKind.ActiveDay;
  /** Integer 1–77; never clamp an elapsed journey into a fictional active Day 78. */
  dayNumber: number;
  calendarDate: TCalendarDate;
}

export interface ICompletedJourneyPosition {
  kind: typeof JourneyPositionKind.Completed;
}

export interface IEarlyEndedJourneyPosition {
  kind: typeof JourneyPositionKind.EndedEarly;
  lastReachedDayNumber: number;
}

/** Derived using the fixed journey zone and current instant, not the phone's current date. */
export type TJourneyPosition =
  IActiveJourneyPosition | ICompletedJourneyPosition | IEarlyEndedJourneyPosition;
