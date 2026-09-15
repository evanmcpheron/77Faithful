import type { ICommunityNotification } from '@td/types/community/community-notification.types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
	getCommunityNotificationReason,
	listCommunityNotifications,
} from './community-notification.service';

const unavailable = new Set([
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'AccountUnavailable',
]);
type TInboxState =
	| { status: 'Loading' | 'Unavailable' | 'Error' }
	| {
			status: 'Ready';
			items: ICommunityNotification[];
			nextCursor: string | null;
			unreadCount: number;
			refreshing: boolean;
			refreshError: boolean;
			loadingMore: boolean;
			loadMoreError: boolean;
	  };

export const mergeNotificationPages = (
	current: ICommunityNotification[],
	incoming: ICommunityNotification[],
): ICommunityNotification[] => {
	const byId = new Map(current.map((item) => [item.eventId, item]));
	for (const item of incoming) byId.set(item.eventId, item);
	return [...byId.values()].sort(
		(left, right) =>
			right.createdAt.seconds - left.createdAt.seconds ||
			right.createdAt.nanoseconds - left.createdAt.nanoseconds ||
			right.eventId.localeCompare(left.eventId),
	);
};

export const useCommunityNotifications = (userId: string | null) => {
	const [state, setState] = useState<TInboxState>({ status: 'Loading' });
	const generation = useRef(0);
	const focused = useRef(false);
	const paging = useRef(false);

	const refresh = useCallback(async () => {
		if (!userId || !focused.current) return;
		const currentGeneration = ++generation.current;
		paging.current = false;
		setState((current) =>
			current.status === 'Ready'
				? { ...current, refreshing: true, refreshError: false }
				: { status: 'Loading' },
		);
		try {
			const page = await listCommunityNotifications();
			if (currentGeneration !== generation.current || !focused.current)
				return;
			setState({
				status: 'Ready',
				items: mergeNotificationPages([], page.notifications),
				nextCursor: page.nextCursor,
				unreadCount: page.unreadCount,
				refreshing: false,
				refreshError: false,
				loadingMore: false,
				loadMoreError: false,
			});
		} catch (error: unknown) {
			if (currentGeneration !== generation.current || !focused.current)
				return;
			const reason = getCommunityNotificationReason(error);
			if (reason && unavailable.has(reason))
				setState({ status: 'Unavailable' });
			else
				setState((current) =>
					current.status === 'Ready'
						? { ...current, refreshing: false, refreshError: true }
						: { status: 'Error' },
				);
		}
	}, [userId]);

	useFocusEffect(
		useCallback(() => {
			focused.current = true;
			generation.current += 1;
			setState({ status: userId ? 'Loading' : 'Unavailable' });
			if (userId) void refresh();
			return () => {
				focused.current = false;
				generation.current += 1;
				paging.current = false;
			};
		}, [userId, refresh]),
	);

	const loadMore = useCallback(async () => {
		if (
			!userId ||
			!focused.current ||
			paging.current ||
			state.status !== 'Ready' ||
			state.refreshing ||
			state.loadingMore ||
			!state.nextCursor
		)
			return;
		paging.current = true;
		const currentGeneration = generation.current;
		const cursor = state.nextCursor;
		setState({ ...state, loadingMore: true, loadMoreError: false });
		try {
			const page = await listCommunityNotifications({ cursor });
			if (currentGeneration !== generation.current || !focused.current)
				return;
			setState({
				...state,
				items: mergeNotificationPages(state.items, page.notifications),
				nextCursor: page.nextCursor,
				unreadCount: page.unreadCount,
				loadingMore: false,
				loadMoreError: false,
			});
		} catch (error: unknown) {
			if (currentGeneration !== generation.current || !focused.current)
				return;
			const reason = getCommunityNotificationReason(error);
			if (reason && unavailable.has(reason))
				setState({ status: 'Unavailable' });
			else
				setState({ ...state, loadingMore: false, loadMoreError: true });
		} finally {
			if (currentGeneration === generation.current)
				paging.current = false;
		}
	}, [userId, state]);

	return { state, refresh, loadMore, isCurrent: () => focused.current };
};
