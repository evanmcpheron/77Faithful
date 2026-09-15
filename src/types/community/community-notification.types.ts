import type { IPersistedTimestamp } from '../shared/persistence.types';

export type TCommunityNotificationCategory =
	'Reply' | 'PrayerSupport' | 'Announcement';
export type TCommunityNotificationReason =
	| 'InvalidInput'
	| 'InvalidCursor'
	| 'AccountUnavailable'
	| 'CommunityUnavailable'
	| 'OperationPayloadMismatch'
	| 'NotificationUnavailable';

export interface ICommunityNotificationEventDocument {
	schemaVersion: 1;
	communityId: string;
	postId: string;
	replyId: string | null;
	actorUserId: string;
	category: TCommunityNotificationCategory;
	createdAt: IPersistedTimestamp;
	cursorUserId: string | null;
	status: 'Pending' | 'Complete';
}

export interface ICommunityNotificationDocument {
	schemaVersion: 1;
	eventId: string;
	communityId: string;
	postId: string;
	replyId: string | null;
	actorUserId: string;
	category: TCommunityNotificationCategory;
	createdAt: IPersistedTimestamp;
	joinedAt: IPersistedTimestamp;
	readAt: IPersistedTimestamp | null;
}

export type ICommunityNotification = Omit<
	ICommunityNotificationDocument,
	'schemaVersion' | 'joinedAt'
>;
export interface IListCommunityNotificationsRequest {
	pageSize?: number;
	cursor?: string;
}
export interface IListCommunityNotificationsResult {
	notifications: ICommunityNotification[];
	nextCursor: string | null;
	unreadCount: number;
}
export interface ICommunityNotificationIdRequest {
	eventId: string;
}
export interface IMarkCommunityNotificationReadRequest extends ICommunityNotificationIdRequest {
	operationId: string;
}
export interface ICommunityNotificationOpenResult {
	status: 'Available' | 'Unavailable';
	communityId: string | null;
	postId: string | null;
	replyId: string | null;
}
export interface ICommunityNotificationPreferenceRequest {
	communityId: string;
}
export interface ISetCommunityNotificationPreferenceRequest extends ICommunityNotificationPreferenceRequest {
	category: TCommunityNotificationCategory;
	categoryEnabled: boolean;
	pushEnabled: boolean;
	operationId: string;
}
export interface ICommunityNotificationPreferenceResult {
	communityId: string;
	categories: Record<TCommunityNotificationCategory, boolean>;
	pushEnabled: boolean;
}
