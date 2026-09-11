import type { IPersistedTimestamp } from './persistence.types';

export const LocalSaveStatus = {
	SavedOnDevice: 'SavedOnDevice',
	SavedToAccount: 'SavedToAccount',
	NeedsReview: 'NeedsReview',
} as const;

export type TLocalSaveStatus =
	(typeof LocalSaveStatus)[keyof typeof LocalSaveStatus];

/** Local storage only. No Saved state may be asserted before durable storage succeeds. */
export interface IUnacknowledgedLocalSaveState {
	status:
		| typeof LocalSaveStatus.SavedOnDevice
		| typeof LocalSaveStatus.NeedsReview;
	savedOnDeviceAt: IPersistedTimestamp;
	lastAccountAcknowledgedAt: IPersistedTimestamp | null;
}

export interface IAccountAcknowledgedLocalSaveState {
	status: typeof LocalSaveStatus.SavedToAccount;
	savedOnDeviceAt: IPersistedTimestamp;
	lastAccountAcknowledgedAt: IPersistedTimestamp;
}

export type TLocalSaveState =
	IUnacknowledgedLocalSaveState | IAccountAcknowledgedLocalSaveState;

export const OfflinePreparationStatus = {
	NotPrepared: 'NotPrepared',
	Preparing: 'Preparing',
	Ready: 'Ready',
	Failed: 'Failed',
} as const;

export type TOfflinePreparationStatus =
	(typeof OfflinePreparationStatus)[keyof typeof OfflinePreparationStatus];

// An operation ID is for deduplication, never an ownership or authorization credential.
export interface IParticipantChangeOrigin {
	readonly operationId: string;
	readonly deviceId: string;
	readonly recordedOnDeviceAt: IPersistedTimestamp;
}
