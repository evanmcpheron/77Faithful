import { app } from '@td/services/firebase/firebase.instance';
import type {
	ICommunityNotification,
	ICommunityNotificationOpenResult,
	ICommunityNotificationPreferenceResult,
	IListCommunityNotificationsRequest,
	IListCommunityNotificationsResult,
	IMarkCommunityNotificationReadRequest,
	ISetCommunityNotificationPreferenceRequest,
	TCommunityNotificationReason,
} from '@td/types/community/community-notification.types';
import { randomUUID } from 'expo-crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	parseCommunityNotificationIdRequest,
	parseGetCommunityNotificationPreferencesRequest,
	parseListCommunityNotificationsRequest,
	parseMarkCommunityNotificationReadRequest,
	parseSetCommunityNotificationPreferencesRequest,
} from './community-notification';

const identifier = /^[A-Za-z0-9_-]{1,128}$/;
const categories = ['Reply', 'PrayerSupport', 'Announcement'];
const reasons = [
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'InvalidInput',
	'InvalidCursor',
	'AccountUnavailable',
	'CommunityUnavailable',
	'OperationPayloadMismatch',
	'NotificationUnavailable',
] as const;

const object = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid notification response.');
	return value as Record<string, unknown>;
};
const fields = (value: Record<string, unknown>, expected: string[]): void => {
	if (
		Object.keys(value).length !== expected.length ||
		!expected.every((key) =>
			Object.prototype.hasOwnProperty.call(value, key),
		)
	)
		throw new Error('Invalid notification response fields.');
};
const timestamp = (value: unknown) => {
	const data = object(value);
	fields(data, ['seconds', 'nanoseconds']);
	if (
		!Number.isInteger(data['seconds']) ||
		!Number.isInteger(data['nanoseconds']) ||
		(data['nanoseconds'] as number) < 0 ||
		(data['nanoseconds'] as number) >= 1_000_000_000
	)
		throw new Error('Invalid notification timestamp.');
	return {
		seconds: data['seconds'] as number,
		nanoseconds: data['nanoseconds'] as number,
	};
};
export const parseCommunityNotification = (
	value: unknown,
): ICommunityNotification => {
	const data = object(value);
	fields(data, [
		'eventId',
		'communityId',
		'postId',
		'replyId',
		'actorUserId',
		'category',
		'createdAt',
		'readAt',
	]);
	if (
		!['eventId', 'communityId', 'postId', 'actorUserId'].every(
			(key) =>
				typeof data[key] === 'string' &&
				identifier.test(data[key] as string),
		) ||
		(data['replyId'] !== null &&
			(typeof data['replyId'] !== 'string' ||
				!identifier.test(data['replyId']))) ||
		!categories.includes(data['category'] as string)
	)
		throw new Error('Invalid notification identity.');
	return {
		eventId: data['eventId'] as string,
		communityId: data['communityId'] as string,
		postId: data['postId'] as string,
		replyId: data['replyId'] as string | null,
		actorUserId: data['actorUserId'] as string,
		category: data['category'] as ICommunityNotification['category'],
		createdAt: timestamp(data['createdAt']),
		readAt: data['readAt'] === null ? null : timestamp(data['readAt']),
	};
};
export const parseListCommunityNotificationsResult = (
	value: unknown,
): IListCommunityNotificationsResult => {
	const data = object(value);
	fields(data, ['notifications', 'nextCursor', 'unreadCount']);
	if (
		!Array.isArray(data['notifications']) ||
		(data['nextCursor'] !== null &&
			(typeof data['nextCursor'] !== 'string' ||
				data['nextCursor'].length > 512)) ||
		!Number.isInteger(data['unreadCount']) ||
		(data['unreadCount'] as number) < 0
	)
		throw new Error('Invalid notification page.');
	return {
		notifications: data['notifications'].map(parseCommunityNotification),
		nextCursor: data['nextCursor'] as string | null,
		unreadCount: data['unreadCount'] as number,
	};
};
export const parseCommunityNotificationOpenResult = (
	value: unknown,
): ICommunityNotificationOpenResult => {
	const data = object(value);
	fields(data, ['status', 'communityId', 'postId', 'replyId']);
	if (
		data['status'] === 'Unavailable' &&
		data['communityId'] === null &&
		data['postId'] === null &&
		data['replyId'] === null
	)
		return {
			status: 'Unavailable',
			communityId: null,
			postId: null,
			replyId: null,
		};
	if (
		data['status'] !== 'Available' ||
		!['communityId', 'postId'].every(
			(key) =>
				typeof data[key] === 'string' &&
				identifier.test(data[key] as string),
		) ||
		(data['replyId'] !== null &&
			(typeof data['replyId'] !== 'string' ||
				!identifier.test(data['replyId'])))
	)
		throw new Error('Invalid notification target.');
	return {
		status: 'Available',
		communityId: data['communityId'] as string,
		postId: data['postId'] as string,
		replyId: data['replyId'] as string | null,
	};
};
export const parseMarkCommunityNotificationReadResult = (
	value: unknown,
): { eventId: string; isRead: true } => {
	const data = object(value);
	fields(data, ['eventId', 'isRead']);
	if (
		typeof data['eventId'] !== 'string' ||
		!identifier.test(data['eventId']) ||
		data['isRead'] !== true
	)
		throw new Error('Invalid notification read result.');
	return { eventId: data['eventId'], isRead: true };
};
export const getCommunityNotificationReason = (
	error: unknown,
): (typeof reasons)[number] | TCommunityNotificationReason | null => {
	if (!error || typeof error !== 'object' || !('details' in error))
		return null;
	const details = error.details;
	if (!details || typeof details !== 'object' || !('reason' in details))
		return null;
	return reasons.find((reason) => reason === details.reason) ?? null;
};
export const listCommunityNotifications = async (
	input: IListCommunityNotificationsRequest = {},
): Promise<IListCommunityNotificationsResult> => {
	const callable = httpsCallable<IListCommunityNotificationsRequest, unknown>(
		getFunctions(app),
		'listCommunityNotifications',
	);
	return parseListCommunityNotificationsResult(
		(await callable(parseListCommunityNotificationsRequest(input))).data,
	);
};
export const openCommunityNotification = async (
	eventId: string,
): Promise<ICommunityNotificationOpenResult> => {
	const callable = httpsCallable<{ eventId: string }, unknown>(
		getFunctions(app),
		'openCommunityNotification',
	);
	return parseCommunityNotificationOpenResult(
		(await callable(parseCommunityNotificationIdRequest({ eventId }))).data,
	);
};
export const markCommunityNotificationRead = async (
	input: IMarkCommunityNotificationReadRequest,
): Promise<void> => {
	const request = parseMarkCommunityNotificationReadRequest(input);
	const callable = httpsCallable<
		IMarkCommunityNotificationReadRequest,
		unknown
	>(getFunctions(app), 'markCommunityNotificationRead');
	const result = parseMarkCommunityNotificationReadResult(
		(await callable(request)).data,
	);
	if (result.eventId !== request.eventId)
		throw new Error('Unexpected notification read result.');
};
export const createCommunityNotificationOperationId = (): string =>
	randomUUID();

export const parseCommunityNotificationPreferenceResult = (
	value: unknown,
): ICommunityNotificationPreferenceResult => {
	const data = object(value);
	fields(data, ['communityId', 'categories', 'pushEnabled']);
	const choices = object(data['categories']);
	fields(choices, categories);
	if (
		typeof data['communityId'] !== 'string' ||
		!identifier.test(data['communityId']) ||
		typeof data['pushEnabled'] !== 'boolean' ||
		!categories.every((category) => typeof choices[category] === 'boolean')
	)
		throw new Error('Invalid notification preference response.');
	return {
		communityId: data['communityId'],
		categories: {
			Reply: choices['Reply'] as boolean,
			PrayerSupport: choices['PrayerSupport'] as boolean,
			Announcement: choices['Announcement'] as boolean,
		},
		pushEnabled: data['pushEnabled'],
	};
};

export const getCommunityNotificationPreferences = async (
	communityId: string,
): Promise<ICommunityNotificationPreferenceResult> => {
	const request = parseGetCommunityNotificationPreferencesRequest({
		communityId,
	});
	const callable = httpsCallable<typeof request, unknown>(
		getFunctions(app),
		'getCommunityNotificationPreferences',
	);
	const result = parseCommunityNotificationPreferenceResult(
		(await callable(request)).data,
	);
	if (result.communityId !== communityId)
		throw new Error('Unexpected community preference response.');
	return result;
};

export const setCommunityNotificationPreferences = async (
	input: ISetCommunityNotificationPreferenceRequest,
): Promise<ICommunityNotificationPreferenceResult> => {
	const request = parseSetCommunityNotificationPreferencesRequest(input);
	const callable = httpsCallable<
		ISetCommunityNotificationPreferenceRequest,
		unknown
	>(getFunctions(app), 'setCommunityNotificationPreferences');
	const result = parseCommunityNotificationPreferenceResult(
		(await callable(request)).data,
	);
	if (result.communityId !== request.communityId)
		throw new Error('Unexpected community preference response.');
	return result;
};
