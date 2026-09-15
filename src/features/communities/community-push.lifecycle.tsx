import { useAuth } from '@td/providers/auth/auth.hook';
import { useJourneyAccess } from '@td/providers/journey/journey-access.provider';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useCommunityInviteIntent } from './community-invite-intent.provider';
import {
	getCommunityPushPermission,
	notifyCommunityPushIncoming,
	openCommunityPush,
	readCommunityPushLocalState,
	registerCommunityPush,
	unregisterCommunityPush,
} from './community-push.service';

const notificationIdFromResponse = (value: unknown): string | null => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		return null;
	const data = value as Record<string, unknown>;
	return Object.keys(data).length === 1 &&
		typeof data['notificationId'] === 'string' &&
		/^[a-f0-9]{64}$/.test(data['notificationId'])
		? data['notificationId']
		: null;
};

export const CommunityPushLifecycle = () => {
	const { account, isInitializing, isProfileReady } = useAuth();
	const journeyAccess = useJourneyAccess();
	const { pendingCode } = useCommunityInviteIntent();
	const rootNavigation = useRootNavigationState();
	const router = useRouter();
	const routerRef = useRef(router);
	useEffect(() => {
		routerRef.current = router;
	}, [router]);
	const currentUserId =
		account?.isEmailConfirmed && isProfileReady ? account.userId : null;
	const accountRef = useRef<string | null>(null);
	const readyRef = useRef(false);
	const pending = useRef<string | null>(null);
	const openedIds = useRef(new Set<string>());
	const opening = useRef(false);
	const openPendingRef = useRef<() => void>(() => {});

	useEffect(() => {
		const previous = accountRef.current;
		accountRef.current = currentUserId;
		readyRef.current =
			!isInitializing &&
			currentUserId !== null &&
			!journeyAccess.isLoading &&
			!journeyAccess.hasError &&
			!pendingCode &&
			Boolean(rootNavigation?.key);
		if (previous && previous !== currentUserId) {
			pending.current = null;
			openedIds.current.clear();
			// Unbinding was attempted before sign-out. On an unexpected account
			// change, keep the old secure identity for a retry on that account.
		}
		if (currentUserId) {
			void readCommunityPushLocalState(currentUserId).then((state) => {
				if (accountRef.current !== currentUserId || !state) return;
				if (state.pendingUnregisterOperationId)
					void unregisterCommunityPush(currentUserId);
				else if (state.deliveryEnabled)
					void registerCommunityPush(currentUserId, false);
			});
		}
		if (readyRef.current) openPendingRef.current();
	}, [
		currentUserId,
		isInitializing,
		journeyAccess.isLoading,
		journeyAccess.hasError,
		pendingCode,
		rootNavigation?.key,
	]);

	useEffect(() => {
		if (Platform.OS === 'web') return;
		let active = true;
		let responseSubscription: { remove: () => void } | null = null;
		let tokenSubscription: { remove: () => void } | null = null;
		let receivedSubscription: { remove: () => void } | null = null;
		const openPending = async () => {
			const notificationId = pending.current;
			const userId = accountRef.current;
			if (
				!active ||
				!readyRef.current ||
				!userId ||
				!notificationId ||
				opening.current ||
				openedIds.current.has(notificationId)
			)
				return;
			opening.current = true;
			pending.current = null;
			try {
				const target = await openCommunityPush(notificationId);
				if (
					!active ||
					accountRef.current !== userId ||
					!readyRef.current
				)
					return;
				openedIds.current.add(notificationId);
				if (openedIds.current.size > 20) {
					const oldest = openedIds.current.values().next().value;
					if (oldest) openedIds.current.delete(oldest);
				}
				if (target.status === 'Available')
					routerRef.current.push({
						pathname: '/communities/[communityId]/posts/[postId]',
						params: {
							communityId: target.communityId!,
							postId: target.postId!,
							...(target.replyId
								? { replyId: target.replyId }
								: {}),
						},
					});
			} catch {
				// Keep the event in the private inbox for a recoverable retry.
			} finally {
				opening.current = false;
			}
		};
		openPendingRef.current = () => {
			void openPending();
		};
		const appSubscription = AppState.addEventListener(
			'change',
			(status) => {
				if (status !== 'active') return;
				const userId = accountRef.current;
				if (!userId) return;
				void readCommunityPushLocalState(userId).then(async (state) => {
					if (!active || accountRef.current !== userId || !state)
						return;
					if (state.pendingUnregisterOperationId)
						void unregisterCommunityPush(userId);
					else if (state.deliveryEnabled) {
						const permission = await getCommunityPushPermission();
						if (
							active &&
							accountRef.current === userId &&
							permission !== 'Unavailable'
						)
							void registerCommunityPush(userId, false);
					}
				});
				void openPending();
			},
		);
		void import('expo-notifications')
			.then(async (api) => {
				if (!active) return;
				api.setNotificationHandler({
					handleNotification: async () => ({
						shouldShowBanner: true,
						shouldShowList: true,
						shouldPlaySound: false,
						shouldSetBadge: false,
					}),
				});
				responseSubscription =
					api.addNotificationResponseReceivedListener((response) => {
						const id = notificationIdFromResponse(
							response.notification.request.content.data,
						);
						if (id) {
							pending.current = id;
							void openPending();
						}
					});
				tokenSubscription = api.addPushTokenListener(() => {
					const userId = accountRef.current;
					if (userId)
						void readCommunityPushLocalState(userId).then(
							(state) => {
								if (
									active &&
									accountRef.current === userId &&
									state?.deliveryEnabled
								)
									void registerCommunityPush(userId, false);
							},
						);
				});
				receivedSubscription = api.addNotificationReceivedListener(
					() => {
						if (readyRef.current) notifyCommunityPushIncoming();
					},
				);
				const last = await api.getLastNotificationResponseAsync();
				if (!active || !last) return;
				const id = notificationIdFromResponse(
					last.notification.request.content.data,
				);
				if (id) {
					pending.current = id;
					void openPending();
				}
				void api.clearLastNotificationResponseAsync();
			})
			.catch(() => {});
		return () => {
			active = false;
			appSubscription.remove();
			responseSubscription?.remove();
			tokenSubscription?.remove();
			receivedSubscription?.remove();
		};
	}, []);
	return null;
};
