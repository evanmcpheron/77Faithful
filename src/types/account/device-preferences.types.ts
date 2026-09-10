import type {
	IDocumentTimestamps,
	TDomainSchemaVersion,
	TLocalClockTime,
} from '../shared/persistence.types';

export const ReminderKind = {
	Morning: 'Morning',
	EveningReflection: 'EveningReflection',
} as const;

export type TReminderKind = (typeof ReminderKind)[keyof typeof ReminderKind];

export interface IEnabledReminderPreference {
	readonly isEnabled: true;
	readonly localTime: TLocalClockTime;
}

export interface IDisabledReminderPreference {
	readonly isEnabled: false;
	readonly localTime: TLocalClockTime | null;
}

export type TReminderPreference =
	IEnabledReminderPreference | IDisabledReminderPreference;

/** deviceId is the path ID. Each phone starts disabled until explicitly enabled there. */
export interface IDevicePreferencesDocument extends IDocumentTimestamps {
	readonly schemaVersion: TDomainSchemaVersion;
	readonly userId: string;
	readonly revision: number;
	readonly morningReminder: TReminderPreference;
	readonly eveningReflectionReminder: TReminderPreference;
}

export interface IChangeDeviceReminderRequest {
	readonly operationId: string;
	readonly deviceId: string;
	readonly expectedRevision: number;
	readonly reminderKind: TReminderKind;
	readonly preference: TReminderPreference;
}

export const NotificationPermissionState = {
	NotRequested: 'NotRequested',
	Granted: 'Granted',
	Denied: 'Denied',
	Unavailable: 'Unavailable',
} as const;

export type TNotificationPermissionState =
	(typeof NotificationPermissionState)[keyof typeof NotificationPermissionState];

/** Local OS state; it is not an account preference or notification-delivery token. */
export interface ILocalNotificationPermission {
	readonly deviceId: string;
	readonly state: TNotificationPermissionState;
}

export const ScheduledReminderKind = {
	Morning: ReminderKind.Morning,
	EveningReflection: ReminderKind.EveningReflection,
	Combined: 'Combined',
} as const;

export type TScheduledReminderKind =
	(typeof ScheduledReminderKind)[keyof typeof ScheduledReminderKind];

export interface IScheduledReminder {
	readonly kind: TScheduledReminderKind;
	readonly localTime: TLocalClockTime;
}

/** Derived locally: combine equal times, respect permission, active journey and known completion. */
export interface ILocalReminderSchedule {
	readonly userId: string;
	readonly deviceId: string;
	readonly journeyId: string;
	readonly reminders:
		| readonly []
		| readonly [IScheduledReminder]
		| readonly [IScheduledReminder, IScheduledReminder];
}
