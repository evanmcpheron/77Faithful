import type { TNotificationPermissionState } from '../account/device-preferences.types';
import type { IPersistedTimestamp } from '../shared/persistence.types';

export type TCommunityPushReason =
	| 'InvalidInput'
	| 'AccountUnavailable'
	| 'InstallationOwnedByAnotherDevice'
	| 'InstallationLimitReached'
	| 'OperationPayloadMismatch';

export interface ICommunityPushInstallationDocument {
	schemaVersion: 1;
	userId: string;
	secretDigest: string;
	token: string | null;
	tokenDigest: string | null;
	permission: TNotificationPermissionState;
	deliveryEnabled: boolean;
	tokenStatus: 'Active' | 'Disabled';
	updatedAt: IPersistedTimestamp;
}

export interface IRegisterCommunityPushInstallationRequest {
	installationId: string;
	installationSecret: string;
	operationId: string;
	token: string | null;
	permission: TNotificationPermissionState;
	deliveryEnabled: boolean;
}

export interface IUnregisterCommunityPushInstallationRequest {
	installationId: string;
	installationSecret: string;
	operationId: string;
}

export interface ICommunityPushInstallationResult {
	installationId: string;
	permission: TNotificationPermissionState;
	deliveryEnabled: boolean;
	registered: boolean;
}

export interface ICommunityPushDeliveryDocument {
	schemaVersion: 1;
	userId: string;
	eventId: string;
	installationId: string;
	status: 'Pending' | 'Sending' | 'AwaitReceipt' | 'Complete';
	attempts: number;
	receiptChecks: number;
	nextAttemptAt: IPersistedTimestamp;
	ticketId: string | null;
	tokenDigest: string | null;
	createdAt: IPersistedTimestamp;
}
