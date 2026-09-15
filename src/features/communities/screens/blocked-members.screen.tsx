import { TurndownListScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { IListBlockedCommunityMembersResult } from '@td/types/community/community-block.types';
import { useFocusEffect } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import {
	createCommunitySafetyOperationId,
	getCommunitySafetyReason,
	listBlockedCommunityMembers,
	unblockCommunityMember,
} from '../community-safety.service';

type TBlockedMember = IListBlockedCommunityMembersResult['members'][number];

const BlockedMembersContent = ({ userId }: { userId: string | null }) => {
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const [members, setMembers] = useState<TBlockedMember[]>([]);
	const [cursor, setCursor] = useState<string | null>(null);
	const [status, setStatus] = useState<
		'Loading' | 'Ready' | 'Error' | 'Unavailable'
	>('Loading');
	const [message, setMessage] = useState<string | null>(null);
	const [busyKey, setBusyKey] = useState<string | null>(null);
	const [loadingMore, setLoadingMore] = useState(false);
	const generation = useRef(0);
	const busy = useRef(false);
	const pendingUnblock = useRef<{
		memberUserId: string;
		operationId: string;
	} | null>(null);
	const load = async (mode: 'Initial' | 'More') => {
		if (!userId || busy.current || (mode === 'More' && !cursor)) return;
		busy.current = true;
		const currentGeneration = generation.current;
		if (mode === 'Initial') {
			setStatus('Loading');
			setMembers([]);
			setCursor(null);
		} else setLoadingMore(true);
		setMessage(null);
		try {
			const result = await listBlockedCommunityMembers({
				pageSize: 20,
				...(mode === 'More' && cursor ? { cursor } : {}),
			});
			if (currentGeneration !== generation.current) return;
			setMembers((current) =>
				mode === 'Initial'
					? result.members
					: [
							...current,
							...result.members.filter(
								(member) =>
									!current.some(
										(existing) =>
											existing.blockedUserId ===
											member.blockedUserId,
									),
							),
						],
			);
			setCursor(result.nextCursor);
			setStatus('Ready');
		} catch (error: unknown) {
			if (currentGeneration !== generation.current) return;
			const reason = getCommunitySafetyReason(error);
			if (reason === 'AccountUnavailable') {
				setStatus('Unavailable');
				setMembers([]);
				setCursor(null);
			} else if (mode === 'Initial') setStatus('Error');
			else
				setMessage('We couldn’t load more blocked members. Try again.');
		} finally {
			if (currentGeneration === generation.current) {
				busy.current = false;
				setLoadingMore(false);
			}
		}
	};
	useFocusEffect(
		useCallback(() => {
			generation.current += 1;
			busy.current = false;
			if (userId) void load('Initial');
			else {
				setStatus('Unavailable');
				setMembers([]);
			}
			return () => {
				generation.current += 1;
				busy.current = false;
			};
			// Account changes remount this content.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [userId]),
	);
	const unblock = async (member: TBlockedMember) => {
		if (busyKey || !userId) return;
		pendingUnblock.current =
			pendingUnblock.current?.memberUserId === member.blockedUserId
				? pendingUnblock.current
				: {
						memberUserId: member.blockedUserId,
						operationId: createCommunitySafetyOperationId(),
					};
		const request = pendingUnblock.current;
		const currentGeneration = generation.current;
		setBusyKey(member.blockedUserId);
		setMessage(null);
		try {
			await unblockCommunityMember(request);
			if (currentGeneration !== generation.current) return;
			pendingUnblock.current = null;
			setMembers((current) =>
				current.filter(
					(row) => row.blockedUserId !== member.blockedUserId,
				),
			);
			setMessage(
				`${member.displayName || 'Member'} was unblocked. Their shared content may appear after refresh.`,
			);
		} catch (error: unknown) {
			if (currentGeneration !== generation.current) return;
			const reason = getCommunitySafetyReason(error);
			if (reason) pendingUnblock.current = null;
			setMessage(
				reason
					? 'We couldn’t unblock this member. Try again.'
					: 'We couldn’t confirm the unblock. Retry to confirm the same request.',
			);
		} finally {
			if (currentGeneration === generation.current) setBusyKey(null);
		}
	};
	const header = (
		<View
			style={{
				paddingTop: headerHeight,
				gap: Spacing.Small,
				paddingBottom: Spacing.Large,
			}}
		>
			<View accessibilityRole='header'>
				<Typography size='H1'>Blocked members</Typography>
			</View>
			<Typography
				tone='Secondary'
				weight='Regular'
			>
				Blocking hides a person’s shared content from you and prevents
				the defined interactions. Neither membership is removed.
				Unblocking may show their shared content again after refresh.
			</Typography>
			{message ? (
				<View accessibilityLiveRegion='polite'>
					<Typography
						tone='Secondary'
						weight='Regular'
					>
						{message}
					</Typography>
				</View>
			) : null}
			{status === 'Loading' ? (
				<Typography>Loading blocked members…</Typography>
			) : null}
			{status === 'Unavailable' ? (
				<Typography>
					Blocked members are unavailable for this account.
				</Typography>
			) : null}
			{status === 'Error' ? (
				<>
					<Typography>We couldn’t load blocked members.</Typography>
					<TurndownButton
						variant='Outline'
						onPress={() => void load('Initial')}
					>
						Try again
					</TurndownButton>
				</>
			) : null}
			{status === 'Ready' && members.length === 0 ? (
				<Typography>You have no blocked members.</Typography>
			) : null}
		</View>
	);
	return (
		<TurndownListScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			keyboardEnabled={false}
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			data={members}
			keyExtractor={(member) => member.blockedUserId}
			ListHeaderComponent={header}
			ItemSeparatorComponent={() => (
				<View style={{ height: Spacing.Small }} />
			)}
			renderItem={({ item }) => (
				<Card testID={`blocked-member-${item.blockedUserId}`}>
					<View style={{ gap: Spacing.Small }}>
						<Typography size='H3'>
							{item.displayName || 'Member'}
						</Typography>
						<TurndownButton
							variant='Outline'
							disabled={busyKey !== null}
							loading={busyKey === item.blockedUserId}
							onPress={() =>
								Alert.alert(
									`Unblock ${item.displayName || 'this member'}?`,
									'Their shared content may appear for you again after refresh. This does not change either community membership.',
									[
										{
											text: 'Keep blocked',
											style: 'cancel',
										},
										{
											text: 'Unblock member',
											onPress: () => void unblock(item),
										},
									],
								)
							}
							testID={`unblock-member-${item.blockedUserId}`}
						>
							Unblock member
						</TurndownButton>
					</View>
				</Card>
			)}
			ListFooterComponent={
				status === 'Ready' && cursor ? (
					<TurndownButton
						variant='Outline'
						disabled={loadingMore}
						loading={loadingMore}
						onPress={() => void load('More')}
					>
						Load more
					</TurndownButton>
				) : null
			}
			testID='blocked-members-screen'
		/>
	);
};

export const BlockedMembersScreen = () => {
	const { account } = useAuth();
	const userId = account?.userId ?? null;
	return (
		<BlockedMembersContent
			key={userId ?? 'signed-out'}
			userId={userId}
		/>
	);
};
