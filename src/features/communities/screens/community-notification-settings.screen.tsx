import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { TNotificationPermissionState } from '@td/types/account/device-preferences.types';
import type {
	ICommunityNotificationPreferenceResult,
	ISetCommunityNotificationPreferenceRequest,
	TCommunityNotificationCategory,
} from '@td/types/community/community-notification.types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import {
	createCommunityNotificationOperationId,
	getCommunityNotificationPreferences,
	getCommunityNotificationReason,
	setCommunityNotificationPreferences,
} from '../community-notification.service';
import {
	getCommunityPushPermission,
	registerCommunityPush,
} from '../community-push.service';
import { useCommunityContext } from '../use-community-context.hook';

const categories: {
	key: TCommunityNotificationCategory;
	label: string;
	detail: string;
}[] = [
	{
		key: 'Reply',
		label: 'Relevant replies',
		detail: 'Replies to your posts or conversations you joined.',
	},
	{
		key: 'PrayerSupport',
		label: 'Prayer acknowledgment',
		detail: 'When someone acknowledges a prayer request you shared.',
	},
	{
		key: 'Announcement',
		label: 'Organizer announcements',
		detail: 'New announcements from the community organizer.',
	},
];

const permissionLabel: Record<TNotificationPermissionState, string> = {
	NotRequested: 'Not requested',
	Granted: 'Allowed on this device',
	Denied: 'Blocked on this device',
	Unavailable: 'Unavailable on this device',
};

type TPreferenceState =
	| { status: 'Loading' | 'Unavailable' | 'Error' }
	| { status: 'Ready'; value: ICommunityNotificationPreferenceResult };

const NotificationSettingsContent = ({
	userId,
	communityId,
}: {
	userId: string | null;
	communityId: string | undefined;
}) => {
	const router = useRouter();
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const context = useCommunityContext(userId, communityId);
	const [preference, setPreference] = useState<TPreferenceState>({
		status: 'Loading',
	});
	const [permission, setPermission] =
		useState<TNotificationPermissionState>('Unavailable');
	const [deviceIssue, setDeviceIssue] = useState<string | null>(null);
	const [deviceReady, setDeviceReady] = useState(false);
	const [deviceBusy, setDeviceBusy] = useState(false);
	const [saving, setSaving] = useState(false);
	const [pendingRequest, setPendingRequest] =
		useState<ISetCommunityNotificationPreferenceRequest | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const pending = useRef<ISetCommunityNotificationPreferenceRequest | null>(
		null,
	);
	const generation = useRef(0);
	const busy = useRef(false);
	const contextReady =
		context.state.status === 'Ready' &&
		context.state.context.community.status === 'Active' &&
		context.state.context.membership.status === 'Active';

	const reload = useCallback(
		async (currentGeneration: number) => {
			if (!communityId || !userId) {
				setPreference({ status: 'Unavailable' });
				return;
			}
			setPreference({ status: 'Loading' });
			try {
				const value =
					await getCommunityNotificationPreferences(communityId);
				if (generation.current === currentGeneration)
					setPreference({ status: 'Ready', value });
			} catch (error: unknown) {
				if (generation.current !== currentGeneration) return;
				const reason = getCommunityNotificationReason(error);
				setPreference({
					status:
						reason === 'CommunityUnavailable' ||
						reason === 'AccountUnavailable'
							? 'Unavailable'
							: 'Error',
				});
			}
		},
		[communityId, userId],
	);

	const refreshDevice = useCallback(
		async (currentGeneration: number) => {
			const state = await getCommunityPushPermission();
			if (generation.current === currentGeneration) {
				setPermission(state);
				if (state === 'Unavailable') setDeviceReady(false);
			}
			if (!userId || state === 'Unavailable') return;
			try {
				const result = await registerCommunityPush(userId, false);
				if (generation.current !== currentGeneration) return;
				setPermission(result.permission);
				setDeviceReady(result.deliveryEnabled && result.registered);
				setDeviceIssue(result.issue);
			} catch {
				if (generation.current === currentGeneration)
					setDeviceIssue('Could not check this device. Try again.');
			}
		},
		[userId],
	);

	useFocusEffect(
		useCallback(() => {
			const currentGeneration = ++generation.current;
			setSaving(false);
			setDeviceBusy(false);
			if (pending.current)
				setMessage(
					'We could not confirm the last change. Retry to confirm the same request.',
				);
			if (contextReady) void reload(currentGeneration);
			else if (context.state.status !== 'Loading')
				setPreference({ status: 'Unavailable' });
			void refreshDevice(currentGeneration);
			return () => {
				generation.current++;
				busy.current = false;
			};
		}, [reload, refreshDevice, contextReady, context.state.status]),
	);

	const save = async (
		category: TCommunityNotificationCategory,
		enabled: boolean,
		pushEnabled: boolean,
	) => {
		if (
			busy.current ||
			pending.current ||
			!communityId ||
			!userId ||
			!contextReady ||
			preference.status !== 'Ready'
		)
			return;
		pending.current = {
			communityId,
			category,
			categoryEnabled: enabled,
			pushEnabled,
			operationId: createCommunityNotificationOperationId(),
		};
		setPendingRequest(pending.current);
		await retrySave();
	};
	const retrySave = async () => {
		const request = pending.current;
		if (busy.current || !request || !contextReady) return;
		busy.current = true;
		setSaving(true);
		setMessage(null);
		const currentGeneration = generation.current;
		try {
			const value = await setCommunityNotificationPreferences(request);
			if (generation.current !== currentGeneration) return;
			pending.current = null;
			setPendingRequest(null);
			setPreference({ status: 'Ready', value });
			setMessage('Community notification preferences saved.');
		} catch (error: unknown) {
			if (generation.current !== currentGeneration) return;
			const reason = getCommunityNotificationReason(error);
			if (
				reason === 'CommunityUnavailable' ||
				reason === 'AccountUnavailable' ||
				reason === 'OperationPayloadMismatch'
			) {
				pending.current = null;
				setPendingRequest(null);
				setMessage(
					'Your access or preference changed. Review the latest settings.',
				);
				void reload(currentGeneration);
				context.retry();
			} else {
				setMessage(
					'We could not confirm this change. Retry the same request.',
				);
			}
		} finally {
			if (generation.current === currentGeneration) {
				busy.current = false;
				setSaving(false);
			}
		}
	};
	const enableDevice = async () => {
		if (!userId || deviceBusy) return;
		setDeviceBusy(true);
		const currentGeneration = generation.current;
		try {
			const result = await registerCommunityPush(userId, true);
			if (generation.current !== currentGeneration) return;
			setPermission(result.permission);
			setDeviceReady(result.registered && result.deliveryEnabled);
			setDeviceIssue(result.issue);
		} catch {
			if (generation.current === currentGeneration)
				setDeviceIssue(
					'Could not enable notifications on this device. Try again.',
				);
		} finally {
			if (generation.current === currentGeneration) setDeviceBusy(false);
		}
	};
	const value = preference.status === 'Ready' ? preference.value : null;
	const canEdit = contextReady && !!value && !pendingRequest && !saving;
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			testID='community-notification-settings-screen'
		>
			<View
				style={{
					paddingTop: headerHeight,
					gap: Spacing.Large,
					width: '100%',
					maxWidth: 640,
					alignSelf: 'center',
				}}
			>
				<View
					style={{ gap: Spacing.Small }}
					accessibilityRole='header'
				>
					<Typography size='H1'>Community notifications</Typography>
					<Typography
						tone='Secondary'
						weight='Regular'
					>
						Choose push alerts for this community. Relevant in-app
						history remains in your inbox when push is muted. Blocks
						and loss of access follow their own privacy rules.
					</Typography>
				</View>
				{message ? (
					<View
						accessibilityRole='alert'
						accessibilityLiveRegion='polite'
					>
						<Typography tone='Secondary'>{message}</Typography>
					</View>
				) : null}
				{pendingRequest ? (
					<TurndownButton
						variant='Outline'
						loading={saving}
						disabled={saving || !contextReady}
						onPress={() => void retrySave()}
					>
						Retry save
					</TurndownButton>
				) : null}
				{context.state.status === 'Loading' ||
				preference.status === 'Loading' ? (
					<Typography>Loading preferences…</Typography>
				) : null}
				{context.state.status === 'Unavailable' ||
				preference.status === 'Unavailable' ||
				(context.state.status === 'Ready' && !contextReady) ? (
					<Typography>
						Notification controls are unavailable for this community
						or membership. Your inbox can still show items you may
						access.
					</Typography>
				) : null}
				{context.state.status === 'Error' ||
				preference.status === 'Error' ? (
					<>
						<Typography>
							Could not load community preferences.
						</Typography>
						<TurndownButton
							variant='Outline'
							onPress={() => {
								context.retry();
								if (contextReady)
									void reload(generation.current);
							}}
						>
							Try again
						</TurndownButton>
					</>
				) : null}
				{value && contextReady ? (
					<Card>
						<View style={{ gap: Spacing.Medium }}>
							<Typography size='H2'>
								Push delivery for this community
							</Typography>
							<TurndownButton
								variant='Outline'
								disabled={!canEdit}
								accessibilityLabel={`Community push ${value.pushEnabled ? 'on' : 'off'}. Change to ${value.pushEnabled ? 'off' : 'on'}`}
								onPress={() =>
									void save(
										'Reply',
										value.categories.Reply,
										!value.pushEnabled,
									)
								}
								testID='community-push-mute'
							>
								{value.pushEnabled
									? 'Mute community push'
									: 'Allow community push'}
							</TurndownButton>
							{categories.map(({ key, label, detail }) => (
								<View
									key={key}
									style={{ gap: Spacing.XSmall }}
								>
									<Typography size='H3'>{label}</Typography>
									<Typography
										tone='Secondary'
										weight='Regular'
									>
										{detail}
									</Typography>
									<TurndownButton
										variant='Outline'
										disabled={!canEdit}
										accessibilityLabel={`${label} push ${value.categories[key] ? 'on' : 'off'}. Change to ${value.categories[key] ? 'off' : 'on'}`}
										onPress={() =>
											void save(
												key,
												!value.categories[key],
												value.pushEnabled,
											)
										}
										testID={`notification-category-${key}`}
									>
										{value.categories[key]
											? 'Turn off'
											: 'Turn on'}
									</TurndownButton>
								</View>
							))}
						</View>
					</Card>
				) : null}
				<Card>
					<View style={{ gap: Spacing.Small }}>
						<Typography size='H2'>This device</Typography>
						<Typography>
							OS permission: {permissionLabel[permission]}
						</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							{deviceReady
								? 'This device is registered for community push.'
								: permission === 'Granted'
									? 'Permission is allowed, but push delivery is not ready on this device.'
									: 'Device permission and community preferences are separate. You can still use communities and the inbox.'}
						</Typography>
						{deviceIssue ? (
							<Typography tone='Error'>{deviceIssue}</Typography>
						) : null}
						{permission === 'Denied' ? (
							<TurndownButton
								variant='Outline'
								onPress={() => void Linking.openSettings()}
							>
								Open device settings
							</TurndownButton>
						) : permission !== 'Unavailable' && !deviceReady ? (
							<TurndownButton
								variant='Outline'
								loading={deviceBusy}
								disabled={deviceBusy}
								onPress={() => void enableDevice()}
							>
								Enable notifications
							</TurndownButton>
						) : null}
						<TurndownButton
							variant='Ghost'
							onPress={() =>
								void refreshDevice(generation.current)
							}
						>
							Check device permission again
						</TurndownButton>
					</View>
				</Card>
				<TurndownButton
					variant='Ghost'
					onPress={() => router.push('/settings/notifications')}
				>
					Open inbox
				</TurndownButton>
			</View>
		</TurndownScrollScreen>
	);
};

export const CommunityNotificationSettingsScreen = () => {
	const { communityId } = useLocalSearchParams<{ communityId?: string }>();
	const { account } = useAuth();
	return (
		<NotificationSettingsContent
			key={`${account?.userId ?? 'signed-out'}:${communityId ?? 'missing'}`}
			userId={account?.userId ?? null}
			communityId={communityId}
		/>
	);
};
