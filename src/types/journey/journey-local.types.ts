import type { TBibleVersionId } from '../formation/bible-version.types';
import type { IFormationCourseReference } from '../formation/formation-course.types';
import type {
	IPersistedTimestamp,
	TCalendarDate,
} from '../shared/persistence.types';
import type {
	IParticipantChangeOrigin,
	TLocalSaveState,
	TOfflinePreparationStatus,
} from '../shared/sync.types';
import type {
	IPracticeCompletion,
	ISetPracticeCompletionRequest,
} from './journey-day.types';
import type {
	TDailyWritingTarget,
	TWritingTarget,
} from './journey-writing.types';

/** Per account and phone, not Firestore data or permission to preview future content. */
export interface ILocalJourneyPreparation {
	userId: string;
	deviceId: string;
	journeyId: string;
	course: IFormationCourseReference;
	bibleVersionId: TBibleVersionId;
	bibleTextEditionId: string;
	status: TOfflinePreparationStatus;
	// Ready requires all 77 days of guidance AND full assigned Scripture in this version.
	readyAt: IPersistedTimestamp | null;
}

/** A recoverable editor draft is not a saved account entry or a written-reflection count. */
export interface ILocalWritingDraft {
	userId: string;
	deviceId: string;
	target: TWritingTarget;
	baseRevisionId: string | null;
	text: string;
	draftSavedOnDeviceAt: IPersistedTimestamp;
}

/** Durable participant save; null means a pending deletion, not an absent operation. */
export interface ILocalWritingChange {
	userId: string;
	target: TWritingTarget;
	baseRevisionId: string | null;
	text: string | null;
	origin: IParticipantChangeOrigin;
	saveState: TLocalSaveState;
}

export interface ILocalPracticeCompletionChange {
	userId: string;
	request: ISetPracticeCompletionRequest;
	saveState: TLocalSaveState;
}

export const PracticeCompletionConflictReason = {
	AssignmentChanged: 'AssignmentChanged',
	CompetingDeclaration: 'CompetingDeclaration',
	DayNotReached: 'DayNotReached',
} as const;

export type TPracticeCompletionConflictReason =
	(typeof PracticeCompletionConflictReason)[keyof typeof PracticeCompletionConflictReason];

/** Retain the actual recorded practice; never move its marker to a replacement practice. */
export interface ILocalPracticeCompletionConflict {
	userId: string;
	localChange: ISetPracticeCompletionRequest;
	reason: TPracticeCompletionConflictReason;
	confirmedCompletion: IPracticeCompletion | null;
	detectedOnDeviceAt: IPersistedTimestamp;
}

/** Private recovery after learning of an early ending, not a reached journey-day document. */
export interface ILocalUnreachedWritingRecovery {
	userId: string;
	deviceId: string;
	intendedTarget: TDailyWritingTarget;
	intendedCalendarDate: TCalendarDate;
	text: string;
	savedOnDeviceAt: IPersistedTimestamp;
	baseRevisionId: string | null;
}
