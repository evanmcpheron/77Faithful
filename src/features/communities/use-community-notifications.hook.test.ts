import type { ICommunityNotification } from '@td/types/community/community-notification.types';
import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { listCommunityNotifications } from './community-notification.service';
import {
	mergeNotificationPages,
	useCommunityNotifications,
} from './use-community-notifications.hook';

jest.mock('expo-router', () => ({
	useFocusEffect: (callback: () => void | (() => void)) => {
		const React = jest.requireActual('react') as typeof import('react');
		React.useEffect(callback, [callback]);
	},
}));
jest.mock('./community-notification.service', () => ({
	listCommunityNotifications: jest.fn(),
	getCommunityNotificationReason: () => null,
}));
jest.mock('./community-push.service', () => ({
	subscribeCommunityPushIncoming: () => () => {},
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const item = (eventId: string, seconds: number): ICommunityNotification => ({
	eventId,
	communityId: 'group',
	postId: 'post',
	replyId: null,
	actorUserId: 'actor',
	category: 'Announcement',
	createdAt: { seconds, nanoseconds: 0 },
	readAt: null,
});
let current: ReturnType<typeof useCommunityNotifications>;
let renderer: ReactTestRenderer | null = null;
const Probe = ({ userId }: { userId: string }) => {
	const value = useCommunityNotifications(userId);
	useEffect(() => {
		current = value;
	}, [value]);
	return null;
};
beforeEach(() => {
	jest.clearAllMocks();
	renderer = null;
});
afterEach(() => {
	if (renderer) act(() => renderer?.unmount());
});

it('deduplicates event IDs and orders by timestamp then ID', () => {
	expect(
		mergeNotificationPages(
			[item('old', 1), item('a', 2)],
			[item('a', 2), item('b', 2)],
		).map((event) => event.eventId),
	).toEqual(['b', 'a', 'old']);
});
it('loads a scanned empty page then paginates with the opaque account cursor', async () => {
	jest.mocked(listCommunityNotifications)
		.mockResolvedValueOnce({
			notifications: [],
			nextCursor: 'cursor',
			unreadCount: 2,
		})
		.mockResolvedValueOnce({
			notifications: [item('event', 1)],
			nextCursor: null,
			unreadCount: 2,
		});
	await act(async () => {
		renderer = create(createElement(Probe, { userId: 'first' }));
	});
	if (current.state.status !== 'Ready') throw new Error('Inbox not ready.');
	expect(current.state.items).toEqual([]);
	await act(async () => current.loadMore());
	if (current.state.status !== 'Ready') throw new Error('Inbox not ready.');
	expect(current.state.items.map((event) => event.eventId)).toEqual([
		'event',
	]);
	expect(listCommunityNotifications).toHaveBeenLastCalledWith({
		cursor: 'cursor',
	});
});
it('keeps pagination errors retryable and preserves already loaded events', async () => {
	jest.mocked(listCommunityNotifications)
		.mockResolvedValueOnce({
			notifications: [item('new', 2)],
			nextCursor: 'cursor',
			unreadCount: 1,
		})
		.mockRejectedValueOnce(new Error('offline'))
		.mockResolvedValueOnce({
			notifications: [item('old', 1)],
			nextCursor: null,
			unreadCount: 1,
		});
	await act(async () => {
		renderer = create(createElement(Probe, { userId: 'first' }));
	});
	await act(async () => current.loadMore());
	if (current.state.status !== 'Ready') throw new Error('Inbox not ready.');
	expect(current.state.loadMoreError).toBe(true);
	expect(current.state.items.map((event) => event.eventId)).toEqual(['new']);
	await act(async () => current.loadMore());
	if (current.state.status !== 'Ready') throw new Error('Inbox not ready.');
	expect(current.state.items.map((event) => event.eventId)).toEqual([
		'new',
		'old',
	]);
});
it('ignores an old account response after account switching', async () => {
	let resolveOld!: (value: {
		notifications: ICommunityNotification[];
		nextCursor: null;
		unreadCount: number;
	}) => void;
	jest.mocked(listCommunityNotifications)
		.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveOld = resolve;
				}),
		)
		.mockResolvedValueOnce({
			notifications: [item('second', 2)],
			nextCursor: null,
			unreadCount: 1,
		});
	await act(async () => {
		renderer = create(createElement(Probe, { userId: 'first' }));
	});
	await act(async () => {
		renderer?.update(createElement(Probe, { userId: 'second' }));
	});
	await act(async () => {
		resolveOld({
			notifications: [item('first', 1)],
			nextCursor: null,
			unreadCount: 1,
		});
	});
	if (current.state.status !== 'Ready') throw new Error('Inbox not ready.');
	expect(current.state.items.map((event) => event.eventId)).toEqual([
		'second',
	]);
});
