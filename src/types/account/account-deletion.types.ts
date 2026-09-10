import type {
	IDocumentTimestamps,
	IPersistedTimestamp,
	TDomainSchemaVersion,
} from '../shared/persistence.types';

export const AccountDeletionStatus = {
	Requested: 'Requested',
	InProgress: 'InProgress',
	Failed: 'Failed',
	Completed: 'Completed',
} as const;

export type TAccountDeletionStatus =
	(typeof AccountDeletionStatus)[keyof typeof AccountDeletionStatus];

export const AccountDeletionFailureReason = {
	TemporaryFailure: 'TemporaryFailure',
	ReauthenticationRequired: 'ReauthenticationRequired',
	SupportRequired: 'SupportRequired',
} as const;

export type TAccountDeletionFailureReason =
	(typeof AccountDeletionFailureReason)[keyof typeof AccountDeletionFailureReason];

export interface IAccountDeletionRequestedState {
	readonly status: typeof AccountDeletionStatus.Requested;
	readonly requestedAt: IPersistedTimestamp;
}

export interface IAccountDeletionInProgressState {
	readonly status: typeof AccountDeletionStatus.InProgress;
	readonly requestedAt: IPersistedTimestamp;
	readonly startedAt: IPersistedTimestamp;
}

export interface IAccountDeletionFailedState {
	readonly status: typeof AccountDeletionStatus.Failed;
	readonly requestedAt: IPersistedTimestamp;
	readonly failedAt: IPersistedTimestamp;
	readonly failureReason: TAccountDeletionFailureReason;
}

export interface IAccountDeletionCompletedState {
	readonly status: typeof AccountDeletionStatus.Completed;
	readonly requestedAt: IPersistedTimestamp;
	readonly completedAt: IPersistedTimestamp;
}

export type TAccountDeletionState =
	| IAccountDeletionRequestedState
	| IAccountDeletionInProgressState
	| IAccountDeletionFailedState
	| IAccountDeletionCompletedState;

/** Private server process, independently keyed by deletionRequestId; the profile may be gone. */
export interface IAccountDeletionProcessDocument extends IDocumentTimestamps {
	readonly schemaVersion: TDomainSchemaVersion;
	readonly userId: string;
	readonly operationId: string;
	readonly state: TAccountDeletionState;
}

/** Account identity and recent authorization come from the authenticated server context. */
export interface IRequestAccountDeletionRequest {
	readonly operationId: string;
	readonly confirmsPermanentDeletion: true;
}

export interface IRequestAccountDeletionResult {
	readonly deletionRequestId: string;
	readonly state: TAccountDeletionState;
}
