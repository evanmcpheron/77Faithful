import type {
	IDocumentTimestamps,
	IPersistedTimestamp,
} from '../shared/persistence.types';
import type { IParticipantChangeOrigin } from '../shared/sync.types';

export const WritingKind = {
	SetupMotivation: 'SetupMotivation',
	StartingMotivation: 'StartingMotivation',
	DailyIntention: 'DailyIntention',
	DailyReflection: 'DailyReflection',
} as const;

export type TWritingKind = (typeof WritingKind)[keyof typeof WritingKind];

export interface ISetupMotivationTarget {
	kind: typeof WritingKind.SetupMotivation;
	setupDraftId: string;
}

export interface IStartingMotivationTarget {
	kind: typeof WritingKind.StartingMotivation;
	journeyId: string;
}

export interface IDailyIntentionTarget {
	kind: typeof WritingKind.DailyIntention;
	journeyId: string;
	/** Integer 1–77; an address alone does not establish reached-day eligibility. */
	dayNumber: number;
}

export interface IDailyReflectionTarget {
	kind: typeof WritingKind.DailyReflection;
	journeyId: string;
	/** Integer 1–77; an address alone does not establish reached-day eligibility. */
	dayNumber: number;
}

export type TDailyWritingTarget =
	IDailyIntentionTarget | IDailyReflectionTarget;
export type TWritingTarget =
	ISetupMotivationTarget | IStartingMotivationTarget | TDailyWritingTarget;

/** Bounded snapshot on the owning setup, journey, or day. Revisions live separately. */
export interface IWritingHead {
	readonly revisionId: string;
	// A deletion keeps a revision tombstone so a stale device cannot silently restore text.
	readonly text: string | null;
	readonly updatedAt: IPersistedTimestamp;
}

/** Private body at a revisionId path. Origin time is advisory; savedAt is authoritative. */
export interface IWritingRevisionDocument {
	readonly userId: string;
	readonly target: TWritingTarget;
	readonly baseRevisionId: string | null;
	readonly text: string | null;
	readonly origin: IParticipantChangeOrigin;
	readonly savedAt: IPersistedTimestamp;
}

export const WritingConflictStatus = {
	Unresolved: 'Unresolved',
	Resolved: 'Resolved',
} as const;

export type TWritingConflictStatus =
	(typeof WritingConflictStatus)[keyof typeof WritingConflictStatus];

export interface IUnresolvedWritingConflict {
	status: typeof WritingConflictStatus.Unresolved;
}

export interface IResolvedWritingConflict {
	status: typeof WritingConflictStatus.Resolved;
	resolvedRevisionId: string;
	resolvedAt: IPersistedTimestamp;
}

/** One conflict per incompatible revision pair, never a growing array on a writing field. */
export interface IWritingConflictDocument extends IDocumentTimestamps {
	readonly userId: string;
	readonly target: TWritingTarget;
	readonly currentRevisionId: string;
	readonly competingRevisionId: string;
	resolution: IUnresolvedWritingConflict | IResolvedWritingConflict;
}

/** Account saves must validate ownership and day eligibility; invalid-day writing stays recoverable locally. */
export interface ISaveWritingRequest {
	target: TWritingTarget;
	expectedRevisionId: string | null;
	text: string;
	origin: IParticipantChangeOrigin;
}

export interface IDeleteWritingRequest {
	target: TWritingTarget;
	expectedRevisionId: string;
	origin: IParticipantChangeOrigin;
}

// A save may preserve a competing revision without replacing the current head.
export interface ISaveWritingResult {
	savedRevisionId: string;
	currentWriting: IWritingHead;
	conflictId: string | null;
}

// A competing saved edit must remain visible for review before claiming removal is complete.
export interface IDeleteWritingResult {
	deletionRevisionId: string;
	currentWriting: IWritingHead;
	conflictId: string | null;
}

export const WritingResolutionKind = {
	RetainRevision: 'RetainRevision',
	ComposeText: 'ComposeText',
} as const;

export type TWritingResolutionKind =
	(typeof WritingResolutionKind)[keyof typeof WritingResolutionKind];

export interface IRetainWritingRevision {
	kind: typeof WritingResolutionKind.RetainRevision;
	revisionId: string;
}

export interface IComposeWritingResolution {
	kind: typeof WritingResolutionKind.ComposeText;
	text: string;
}

export interface IResolveWritingConflictRequest {
	conflictId: string;
	target: TWritingTarget;
	expectedRevisionId: string;
	resolution: IRetainWritingRevision | IComposeWritingResolution;
	origin: IParticipantChangeOrigin;
}

export interface IResolveWritingConflictResult {
	conflictId: string;
	currentWriting: IWritingHead;
}
