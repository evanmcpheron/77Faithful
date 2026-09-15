import { TurndownListScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { ICommunityNotification } from '@td/types/community/community-notification.types';
import { useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import {
	createCommunityNotificationOperationId,
	getCommunityNotificationReason,
	markCommunityNotificationRead,
	openCommunityNotification,
} from '../community-notification.service';
import { useCommunityNotifications } from '../use-community-notifications.hook';

const labels = {
	Reply: 'New reply',
	PrayerSupport: 'Prayer support',
	Announcement: 'Community announcement',
} as const;
const unavailable = new Set([
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'AccountUnavailable',
	'CommunityUnavailable',
	'NotificationUnavailable',
]);
const formatTime = (item: ICommunityNotification): string =>
	new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(item.createdAt.seconds * 1000));

const InboxContent = ({ userId }: { userId: string }) => {
	const router = useRouter();
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const { state, refresh, loadMore, isCurrent } =
		useCommunityNotifications(userId);
	const [openingId, setOpeningId] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const pendingRead = useRef(new Map<string, string>());
	const opening = useRef(false);

	const markRead = async (eventId: string): Promise<boolean> => {
		const operationId =
			pendingRead.current.get(eventId) ??
			createCommunityNotificationOperationId();
		pendingRead.current.set(eventId, operationId);
		try {
			await markCommunityNotificationRead({ eventId, operationId });
			if (!isCurrent()) return false;
			pendingRead.current.delete(eventId);
			void refresh();
			return true;
		} catch (error: unknown) {
			if (!isCurrent()) return false;
			const reason = getCommunityNotificationReason(error);
			setMessage(
				reason && unavailable.has(reason)
					? 'This notification is no longer available.'
					: 'Could not mark this notification read. It remains in your inbox. Try again.',
			);
			return false;
		}
	};
	const select = async (item: ICommunityNotification) => {
		if (opening.current) return;
		opening.current = true;
		setOpeningId(item.eventId);
		setMessage(null);
		try {
			const target = await openCommunityNotification(item.eventId);
			if (!isCurrent()) return;
			if (
				target.status === 'Unavailable' ||
				!target.communityId ||
				!target.postId
			) {
				setMessage(
					'This community post is no longer available to you.',
				);
				void refresh();
				return;
			}
			if (!item.readAt) void markRead(item.eventId);
			router.push({
				pathname: '/communities/[communityId]/posts/[postId]',
				params: {
					communityId: target.communityId,
					postId: target.postId,
					...(target.replyId ? { replyId: target.replyId } : {}),
				},
			});
		} catch (error: unknown) {
			if (!isCurrent()) return;
			const reason = getCommunityNotificationReason(error);
			setMessage(
				reason && unavailable.has(reason)
					? 'This community post is no longer available to you.'
					: 'Could not open this notification. Please try again.',
			);
		} finally {
			opening.current = false;
			if (isCurrent()) {
				setOpeningId(null);
			}
		}
	};

	const header = (
		<View style={{ paddingTop: headerHeight, gap: Spacing.Small }}>
			<View accessibilityRole='header'>
				<Typography size='H1'>Notifications</Typography>
			</View>
			{state.status === 'Ready' ? (
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					{state.unreadCount === 0
						? 'All caught up.'
						: `${state.unreadCount} unread`}
				</Typography>
			) : null}
			{message ? (
				<Typography
					tone='Error'
					weight='Regular'
					testID='notification-message'
				>
					{message}
				</Typography>
			) : null}
			{state.status === 'Loading' ? (
				<Typography>Loading notifications…</Typography>
			) : null}
			{state.status === 'Unavailable' ? (
				<Typography>
					Notifications are unavailable for this account.
				</Typography>
			) : null}
			{state.status === 'Error' ? (
				<>
					<Typography>Could not load notifications.</Typography>
					<TurndownButton
						variant='Outline'
						onPress={() => void refresh()}
					>
						Try again
					</TurndownButton>
				</>
			) : null}
			{state.status === 'Ready' && state.items.length === 0 ? (
				<Typography>No notifications yet.</Typography>
			) : null}
			{state.status === 'Ready' && state.refreshError ? (
				<Typography tone='Error'>
					Could not refresh notifications. Try again.
				</Typography>
			) : null}
			{state.status === 'Ready' ? (
				<TurndownButton
					variant='Ghost'
					onPress={() => void refresh()}
				>
					Refresh
				</TurndownButton>
			) : null}
		</View>
	);
	const footer =
		state.status === 'Ready' ? (
			<View
				style={{ gap: Spacing.Small, paddingVertical: Spacing.Medium }}
			>
				{state.loadMoreError ? (
					<Typography tone='Error'>
						Could not load more notifications.
					</Typography>
				) : null}
				{state.nextCursor ? (
					<TurndownButton
						variant='Outline'
						loading={state.loadingMore}
						disabled={state.loadingMore}
						onPress={() => void loadMore()}
					>
						{state.loadMoreError
							? 'Retry loading more'
							: 'Load more'}
					</TurndownButton>
				) : null}
			</View>
		) : null;
	return (
		<TurndownListScreen
			backgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			keyboardEnabled={false}
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			data={state.status === 'Ready' ? state.items : []}
			keyExtractor={(item) => item.eventId}
			ListHeaderComponent={header}
			ListFooterComponent={footer}
			onRefresh={() => void refresh()}
			refreshing={state.status === 'Ready' && state.refreshing}
			onEndReached={() => void loadMore()}
			onEndReachedThreshold={0.5}
			renderItem={({ item }) => (
				<Card testID={`notification-${item.eventId}`}>
					<View style={{ gap: Spacing.XSmall, minHeight: 48 }}>
						<Typography size='H3'>
							{labels[item.category]}
							{item.readAt ? '' : ' · Unread'}
						</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							Community {item.communityId} · {formatTime(item)}
						</Typography>
						<TurndownButton
							variant='Outline'
							accessibilityLabel={`Open ${labels[item.category]} in community ${item.communityId}`}
							disabled={openingId !== null}
							loading={openingId === item.eventId}
							testID={`open-notification-${item.eventId}`}
							onPress={() => void select(item)}
						>
							Open post
						</TurndownButton>
						<TurndownButton
							variant='Ghost'
							onPress={() =>
								router.push({
									pathname:
										'/communities/[communityId]/notification-settings',
									params: { communityId: item.communityId },
								})
							}
						>
							Notification preferences
						</TurndownButton>
						{!item.readAt ? (
							<TurndownButton
								variant='Ghost'
								accessibilityLabel={`Mark ${labels[item.category]} read`}
								disabled={openingId !== null}
								onPress={() => void markRead(item.eventId)}
							>
								Mark read
							</TurndownButton>
						) : null}
					</View>
				</Card>
			)}
			testID='community-notifications-screen'
		/>
	);
};

export const CommunityNotificationsScreen = () => {
	const { account } = useAuth();
	return account?.userId ? (
		<InboxContent
			key={account.userId}
			userId={account.userId}
		/>
	) : (
		<TurndownListScreen
			backgroundColor={SurfaceColors.Screen}
			data={[]}
			renderItem={() => null}
			ListHeaderComponent={
				<Typography>
					Notifications are unavailable for this account.
				</Typography>
			}
		/>
	);
};
