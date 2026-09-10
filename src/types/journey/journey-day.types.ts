import type {
	IFormationDayContentReference,
	TFormationThemeId,
} from '../formation/formation-course.types';
import type {
	TOptionalPracticeId,
	TPracticeId,
} from '../formation/practice.types';
import type {
	IDocumentTimestamps,
	IPersistedTimestamp,
	TCalendarDate,
	TDomainSchemaVersion,
} from '../shared/persistence.types';
import type { IParticipantChangeOrigin } from '../shared/sync.types';
import type { IWritingHead } from './journey-writing.types';

export const PracticeCompletionStatus = {
	NotMarked: 'NotMarked',
	Complete: 'Complete',
} as const;

export type TPracticeCompletionStatus =
	(typeof PracticeCompletionStatus)[keyof typeof PracticeCompletionStatus];

export interface IPracticeCompletion {
	status: TPracticeCompletionStatus;
	revision: number;
	// Null only for the initial, unmarked revision zero; otherwise a confirmed save time.
	updatedAt: IPersistedTimestamp | null;
}

export interface IAssignedOptionalPractice {
	readonly practiceId: TOptionalPracticeId;
	completion: IPracticeCompletion;
}

export type TAssignedOptionalPractices =
	| readonly [IAssignedOptionalPractice, IAssignedOptionalPractice]
	| readonly [
			IAssignedOptionalPractice,
			IAssignedOptionalPractice,
			IAssignedOptionalPractice,
	  ]
	| readonly [
			IAssignedOptionalPractice,
			IAssignedOptionalPractice,
			IAssignedOptionalPractice,
			IAssignedOptionalPractice,
	  ];

/** Foundational practices and two to four distinct Chosen Practices assigned to this day. */
export interface IDailyPractices {
	readScripture: IPracticeCompletion;
	pray: IPracticeCompletion;
	reflect: IPracticeCompletion;
	readonly optionalPractices: TAssignedOptionalPractices;
}

/** Private body keyed by dayNumber within a journey, not an element in a journey array. */
export interface IJourneyDayDocument extends IDocumentTimestamps {
	readonly schemaVersion: TDomainSchemaVersion;
	readonly userId: string;
	readonly journeyId: string;
	/** Integer 1–77 and no later than the last reached day. */
	readonly dayNumber: number;
	readonly calendarDate: TCalendarDate;
	readonly content: IFormationDayContentReference;
	/** Integer 1–11, equal to ceil(dayNumber / 7). */
	readonly weekNumber: number;
	readonly themeId: TFormationThemeId;
	readonly practices: IDailyPractices;
	intention: IWritingHead | null;
	reflection: IWritingHead | null;
	// Excludes administrative materialization/repair; used for the honest late-update indication.
	lastParticipantUpdateAt: IPersistedTimestamp | null;
}

export interface ISetPracticeCompletionRequest {
	journeyId: string;
	dayNumber: number;
	// Address the actual assigned practice, never an optional slot that may have changed offline.
	practiceId: TPracticeId;
	isComplete: boolean;
	expectedCompletionRevision: number;
	origin: IParticipantChangeOrigin;
}

export interface ISetPracticeCompletionResult {
	journeyId: string;
	dayNumber: number;
	practiceId: TPracticeId;
	completion: IPracticeCompletion;
}

export const JourneyDayAccess = {
	Current: 'Current',
	Historical: 'Historical',
	Future: 'Future',
	NotReached: 'NotReached',
} as const;

export type TJourneyDayAccess =
	(typeof JourneyDayAccess)[keyof typeof JourneyDayAccess];

export interface IReachedDayOverview {
	access:
		typeof JourneyDayAccess.Current | typeof JourneyDayAccess.Historical;
	dayNumber: number;
	calendarDate: TCalendarDate;
	practicesMarkedComplete: number;
	hasIntention: boolean;
	hasReflection: boolean;
	wasUpdatedAfterAssignedDay: boolean;
	lastParticipantUpdateAt: IPersistedTimestamp | null;
}

export interface IUnreachedDayOverview {
	access: typeof JourneyDayAccess.Future | typeof JourneyDayAccess.NotReached;
	dayNumber: number;
	calendarDate: TCalendarDate;
}

/** Calculated grid/list entries. Future entries carry no content or participation record. */
export type TJourneyDayOverview = IReachedDayOverview | IUnreachedDayOverview;
