import type {
	ICommunityNotificationIdRequest,
	ICommunityNotificationPreferenceRequest,
	IListCommunityNotificationsRequest,
	IMarkCommunityNotificationReadRequest,
	ISetCommunityNotificationPreferenceRequest,
	TCommunityNotificationCategory,
} from '../../types/community/community-notification.types';

export const CommunityNotificationLimits = {
	identifier: 128,
	cursor: 512,
	defaultPageSize: 20,
	maxPageSize: 50,
} as const;
const idPattern = /^[A-Za-z0-9_-]{1,128}$/;
const categories: TCommunityNotificationCategory[] = [
	'Reply',
	'PrayerSupport',
	'Announcement',
];
const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid notification input.');
	return value as Record<string, unknown>;
};
const keys = (
	value: Record<string, unknown>,
	allowed: string[],
	required: string[] = allowed,
): void => {
	if (
		!Object.keys(value).every((key) => allowed.includes(key)) ||
		!required.every((key) =>
			Object.prototype.hasOwnProperty.call(value, key),
		)
	)
		throw new Error('Unexpected notification field.');
};
const id = (value: unknown): string => {
	if (typeof value !== 'string' || !idPattern.test(value))
		throw new Error('Invalid identifier.');
	return value;
};
export const parseListCommunityNotificationsRequest = (
	value: unknown,
): IListCommunityNotificationsRequest => {
	const input = record(value);
	keys(input, ['pageSize', 'cursor'], []);
	const pageSize =
		input['pageSize'] === undefined
			? CommunityNotificationLimits.defaultPageSize
			: input['pageSize'];
	if (
		typeof pageSize !== 'number' ||
		!Number.isInteger(pageSize) ||
		pageSize < 1 ||
		pageSize > CommunityNotificationLimits.maxPageSize
	)
		throw new Error('Invalid page size.');
	if (
		input['cursor'] !== undefined &&
		(typeof input['cursor'] !== 'string' ||
			input['cursor'].length > CommunityNotificationLimits.cursor)
	)
		throw new Error('Invalid cursor.');
	return {
		pageSize,
		...(input['cursor'] === undefined
			? {}
			: { cursor: input['cursor'] as string }),
	};
};
export const parseCommunityNotificationIdRequest = (
	value: unknown,
): ICommunityNotificationIdRequest => {
	const input = record(value);
	keys(input, ['eventId']);
	return { eventId: id(input['eventId']) };
};
export const parseMarkCommunityNotificationReadRequest = (
	value: unknown,
): IMarkCommunityNotificationReadRequest => {
	const input = record(value);
	keys(input, ['eventId', 'operationId']);
	return {
		eventId: id(input['eventId']),
		operationId: id(input['operationId']),
	};
};
export const parseGetCommunityNotificationPreferencesRequest = (
	value: unknown,
): ICommunityNotificationPreferenceRequest => {
	const input = record(value);
	keys(input, ['communityId']);
	return { communityId: id(input['communityId']) };
};
export const parseSetCommunityNotificationPreferencesRequest = (
	value: unknown,
): ISetCommunityNotificationPreferenceRequest => {
	const input = record(value);
	keys(input, [
		'communityId',
		'category',
		'categoryEnabled',
		'pushEnabled',
		'operationId',
	]);
	if (
		!categories.includes(
			input['category'] as TCommunityNotificationCategory,
		) ||
		typeof input['categoryEnabled'] !== 'boolean' ||
		typeof input['pushEnabled'] !== 'boolean'
	)
		throw new Error('Invalid preference.');
	return {
		communityId: id(input['communityId']),
		category: input['category'] as TCommunityNotificationCategory,
		categoryEnabled: input['categoryEnabled'],
		pushEnabled: input['pushEnabled'],
		operationId: id(input['operationId']),
	};
};
