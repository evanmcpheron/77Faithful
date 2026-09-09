import type { TBibleVersionId } from '../formation/bible-version.types';
import type { TOptionalPracticeId, TOptionalPracticeSelection } from '../formation/practice.types';
import type { IWritingHead } from '../journey/journey-writing.types';
import type { IDocumentTimestamps, TDomainSchemaVersion } from '../shared/persistence.types';

export const JourneySetupStep = {
  Commitment: 'Commitment',
  Practices: 'Practices',
  BibleVersion: 'BibleVersion',
  Motivation: 'Motivation',
  Reminders: 'Reminders',
  WeeklyThemes: 'WeeklyThemes',
  Review: 'Review',
} as const;

export type TJourneySetupStep = (typeof JourneySetupStep)[keyof typeof JourneySetupStep];

export const JourneySetupReadiness = {
  Incomplete: 'Incomplete',
  ReadyForReview: 'ReadyForReview',
} as const;

export type TJourneySetupReadiness =
  (typeof JourneySetupReadiness)[keyof typeof JourneySetupReadiness];

export type TSetupOptionalPracticeSelection =
  readonly [] | readonly [TOptionalPracticeId] | TOptionalPracticeSelection;

export interface IIncompleteJourneySetupChoices {
  readonly readiness: typeof JourneySetupReadiness.Incomplete;
  readonly optionalPracticeIds: TSetupOptionalPracticeSelection;
  readonly bibleVersionId: TBibleVersionId | null;
}

/** Readiness confirms choices only; email, content availability and active-journey checks remain. */
export interface IReadyJourneySetupChoices {
  readonly readiness: typeof JourneySetupReadiness.ReadyForReview;
  readonly optionalPracticeIds: TOptionalPracticeSelection;
  readonly bibleVersionId: TBibleVersionId;
}

export type TJourneySetupChoices = IIncompleteJourneySetupChoices | IReadyJourneySetupChoices;

/** setupDraftId is the path ID. Saving this document never commits a journey date or time zone. */
export interface IJourneySetupDraftDocument extends IDocumentTimestamps {
  readonly schemaVersion: TDomainSchemaVersion;
  readonly userId: string;
  readonly revision: number;
  readonly currentStep: TJourneySetupStep;
  readonly choices: TJourneySetupChoices;
  readonly startingMotivation: IWritingHead | null;
}

/** Motivation uses writing revision operations so saving other choices cannot overwrite it. */
export interface ISaveJourneySetupChoicesRequest {
  readonly operationId: string;
  readonly setupDraftId: string;
  readonly expectedRevision: number;
  readonly currentStep: TJourneySetupStep;
  readonly optionalPracticeIds: TSetupOptionalPracticeSelection;
  readonly bibleVersionId: TBibleVersionId | null;
}

export interface ICancelJourneySetupRequest {
  readonly operationId: string;
  readonly setupDraftId: string;
  readonly expectedRevision: number;
}
