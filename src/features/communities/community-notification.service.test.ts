import {
	getCommunityNotificationPreferences,
	listCommunityNotifications,
	markCommunityNotificationRead,
	openCommunityNotification,
	parseCommunityNotificationOpenResult,
	parseCommunityNotificationPreferenceResult,
	parseListCommunityNotificationsResult,
	setCommunityNotificationPreferences,
} from './community-notification.service';

const preference = {
	communityId: 'group',
	categories: { Reply: false, PrayerSupport: false, Announcement: false },
	pushEnabled: false,
};

const mockCall = jest.fn();
const mockCallable = jest.fn();
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'operation' }));
jest.mock('firebase/functions', () => ({
	getFunctions: () => 'functions',
	httpsCallable: (...args: unknown[]) => mockCallable(...args),
}));
const event = {
	eventId: 'event',
	communityId: 'group',
	postId: 'post',
	replyId: 'reply',
	actorUserId: 'actor',
	category: 'Reply',
	createdAt: { seconds: 100, nanoseconds: 0 },
	readAt: null,
};
beforeEach(() => {
	jest.clearAllMocks();
	mockCallable.mockReturnValue(mockCall);
});

it('loads real event metadata and exact unread state from the authenticated callable', async () => {
	mockCall.mockResolvedValue({
		data: { notifications: [event], nextCursor: 'cursor', unreadCount: 1 },
	});
	expect(await listCommunityNotifications()).toEqual({
		notifications: [event],
		nextCursor: 'cursor',
		unreadCount: 1,
	});
	expect(mockCallable).toHaveBeenCalledWith(
		'functions',
		'listCommunityNotifications',
	);
	expect(mockCall).toHaveBeenCalledWith({ pageSize: 20 });
});
it('passes a stable server cursor without caller identity and accepts an empty scanned page', async () => {
	mockCall.mockResolvedValue({
		data: { notifications: [], nextCursor: 'next', unreadCount: 0 },
	});
	expect(await listCommunityNotifications({ cursor: 'cursor' })).toEqual({
		notifications: [],
		nextCursor: 'next',
		unreadCount: 0,
	});
	expect(mockCall).toHaveBeenCalledWith({ pageSize: 20, cursor: 'cursor' });
});
it('rejects extra fields that could leak private content or fabricate counts', () => {
	expect(() =>
		parseListCommunityNotificationsResult({
			notifications: [{ ...event, text: 'private' }],
			nextCursor: null,
			unreadCount: 1,
		}),
	).toThrow();
	expect(() =>
		parseListCommunityNotificationsResult({
			notifications: [],
			nextCursor: null,
			unreadCount: -1,
		}),
	).toThrow();
});
it('opens only the reauthorized group-scoped target and rejects malformed unavailable targets', async () => {
	mockCall.mockResolvedValueOnce({
		data: {
			status: 'Available',
			communityId: 'group',
			postId: 'post',
			replyId: 'reply',
		},
	});
	expect(await openCommunityNotification('event')).toEqual({
		status: 'Available',
		communityId: 'group',
		postId: 'post',
		replyId: 'reply',
	});
	expect(mockCall).toHaveBeenCalledWith({ eventId: 'event' });
	expect(
		parseCommunityNotificationOpenResult({
			status: 'Unavailable',
			communityId: null,
			postId: null,
			replyId: null,
		}).status,
	).toBe('Unavailable');
	expect(() =>
		parseCommunityNotificationOpenResult({
			status: 'Unavailable',
			communityId: 'group',
			postId: 'post',
			replyId: null,
		}),
	).toThrow();
});
it('retries mark-read with the same operation and validates the event receipt', async () => {
	mockCall
		.mockRejectedValueOnce(new Error('offline'))
		.mockResolvedValueOnce({ data: { eventId: 'event', isRead: true } });
	const request = { eventId: 'event', operationId: 'operation' };
	await expect(markCommunityNotificationRead(request)).rejects.toThrow(
		'offline',
	);
	await expect(
		markCommunityNotificationRead(request),
	).resolves.toBeUndefined();
	expect(mockCall).toHaveBeenNthCalledWith(1, request);
	expect(mockCall).toHaveBeenNthCalledWith(2, request);
});

it('reads and saves per-community push choices through exact server results', async () => {
	mockCall.mockResolvedValueOnce({ data: preference }).mockResolvedValueOnce({
		data: {
			...preference,
			categories: { ...preference.categories, Reply: true },
			pushEnabled: true,
		},
	});
	expect(await getCommunityNotificationPreferences('group')).toEqual(
		preference,
	);
	const request = {
		communityId: 'group',
		category: 'Reply' as const,
		categoryEnabled: true,
		pushEnabled: true,
		operationId: 'operation',
	};
	expect(
		(await setCommunityNotificationPreferences(request)).categories.Reply,
	).toBe(true);
	expect(mockCallable).toHaveBeenNthCalledWith(
		1,
		'functions',
		'getCommunityNotificationPreferences',
	);
	expect(mockCallable).toHaveBeenNthCalledWith(
		2,
		'functions',
		'setCommunityNotificationPreferences',
	);
	expect(mockCall).toHaveBeenNthCalledWith(1, { communityId: 'group' });
	expect(mockCall).toHaveBeenNthCalledWith(2, request);
});

it('rejects malformed or cross-community preference results', async () => {
	expect(() =>
		parseCommunityNotificationPreferenceResult({
			...preference,
			categories: { Reply: true },
		}),
	).toThrow();
	expect(() =>
		parseCommunityNotificationPreferenceResult({
			...preference,
			privateWriting: 'secret',
		}),
	).toThrow();
	mockCall.mockResolvedValue({
		data: { ...preference, communityId: 'other' },
	});
	await expect(getCommunityNotificationPreferences('group')).rejects.toThrow(
		'Unexpected community',
	);
});

it.each(['Reply', 'PrayerSupport', 'Announcement'] as const)(
	'sends %s category independently without changing the reminder model',
	async (category) => {
		mockCall.mockResolvedValue({
			data: {
				...preference,
				categories: { ...preference.categories, [category]: true },
			},
		});
		const request = {
			communityId: 'group',
			category,
			categoryEnabled: true,
			pushEnabled: false,
			operationId: 'operation',
		};
		await setCommunityNotificationPreferences(request);
		expect(mockCall).toHaveBeenCalledWith(request);
	},
);
