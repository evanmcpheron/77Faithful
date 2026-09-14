import { TurndownListScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { ICommunityMemberSummary } from '@td/types/community/community-membership.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
	createCommunityAdministrationOperationId,
	getCommunityAdministrationReason,
	leaveCommunity,
	removeCommunityMember,
	transferCommunityOrganizer,
} from '../community-administration.service';
import {
	type TCommunityContextState,
	useCommunityContext,
} from '../use-community-context.hook';
import {
	type TCommunityMembersState,
	useCommunityMembers,
} from '../use-community-members.hook';
import { communityMemberStyles as styles } from './community-members.styles';

interface ICommunityMembersViewProps {
	contextState: TCommunityContextState;
	membersState: TCommunityMembersState;
	currentUserId: string | null;
	headerHeight: number;
	actionKey: string | null;
	actionMessage: string | null;
	onRetry: () => void;
	onLoadMore: () => void;
	onReturn: () => void;
	onInvite: () => void;
	onSettings: () => void;
	onLeave: () => void;
	onRemove: (member: ICommunityMemberSummary) => void;
	onTransfer: (member: ICommunityMemberSummary) => void;
	scrollOffset: SharedValue<number>;
	onScrollPositionChange: (y: number) => void;
}

const confirmationName = (member: ICommunityMemberSummary): string =>
	member.displayName || 'this member';

const confirmRemoval = (
	member: ICommunityMemberSummary,
	onRemove: (member: ICommunityMemberSummary) => void,
) => {
	Alert.alert(
		`Remove ${confirmationName(member)}?`,
		'Removal ends this person’s community access. It does not erase their private journey, reflections, practice choices, or completion.',
		[
			{ text: 'Keep member', style: 'cancel' },
			{
				text: 'Remove member',
				style: 'destructive',
				onPress: () => onRemove(member),
			},
		],
	);
};

const confirmTransfer = (
	member: ICommunityMemberSummary,
	onTransfer: (member: ICommunityMemberSummary) => void,
) => {
	Alert.alert(
		`Transfer ownership to ${confirmationName(member)}?`,
		'This gives the member community administration. It does not give access to anyone’s private journal, practice choices, completion, or personal journey. You will become a Member.',
		[
			{ text: 'Keep ownership', style: 'cancel' },
			{
				text: 'Transfer ownership',
				style: 'destructive',
				onPress: () => onTransfer(member),
			},
		],
	);
};

const confirmLeave = (onLeave: () => void) => {
	Alert.alert(
		'Leave this community?',
		'You will lose community access. Contributions you deliberately shared with the community will remain until you separately delete them.',
		[
			{ text: 'Stay in community', style: 'cancel' },
			{
				text: 'Leave community',
				style: 'destructive',
				onPress: onLeave,
			},
		],
	);
};

const StateContent = ({
	contextState,
	membersState,
	onRetry,
	onReturn,
}: Pick<
	ICommunityMembersViewProps,
	'contextState' | 'membersState' | 'onRetry' | 'onReturn'
>) => {
	if (
		contextState.status === 'Loading' ||
		membersState.status === 'Idle' ||
		membersState.status === 'Loading'
	)
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
				accessibilityState={{ busy: true }}
			>
				<Typography size='H1'>Loading community members…</Typography>
			</View>
		);

	if (
		contextState.status === 'Unavailable' ||
		membersState.status === 'Unavailable'
	)
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
			>
				<View accessibilityRole='header'>
					<Typography size='H1'>Members are unavailable</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Your membership or permission may have changed.
				</Typography>
				<TurndownButton onPress={onReturn}>
					Your communities
				</TurndownButton>
			</View>
		);

	return (
		<View
			style={styles.section}
			accessibilityLiveRegion='polite'
		>
			<View accessibilityRole='header'>
				<Typography size='H1'>We couldn’t load the members.</Typography>
			</View>
			<Typography
				tone='Secondary'
				weight='Regular'
			>
				Check your connection and try again.
			</Typography>
			<TurndownButton onPress={onRetry}>Try again</TurndownButton>
		</View>
	);
};

export const CommunityMembersView = ({
	contextState,
	membersState,
	currentUserId,
	headerHeight,
	actionKey,
	actionMessage,
	onRetry,
	onLoadMore,
	onReturn,
	onInvite,
	onSettings,
	onLeave,
	onRemove,
	onTransfer,
	scrollOffset,
	onScrollPositionChange,
}: ICommunityMembersViewProps) => {
	const isReady =
		contextState.status === 'Ready' && membersState.status === 'Ready';
	const context = isReady ? contextState.context : null;
	const isActiveOrganizer =
		context?.community.status === 'Active' &&
		context.membership.role === 'Organizer';
	const canManage = Boolean(context?.capabilities.canManageMembers);
	const members = isReady ? membersState.members : [];
	const header = (
		<View style={[styles.content, { paddingTop: headerHeight }]}>
			{context === null ? (
				<StateContent
					contextState={contextState}
					membersState={membersState}
					onRetry={onRetry}
					onReturn={onReturn}
				/>
			) : (
				<>
					<View style={styles.section}>
						<View accessibilityRole='header'>
							<Typography size='Display'>Members</Typography>
						</View>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							Active members of {context.community.name}.
							Membership does not share private writing, practice
							choices, completion, or personal journeys.
						</Typography>
					</View>
					{context.community.status === 'Closed' ? (
						<Card>
							<View style={styles.section}>
								<Typography size='H2'>
									Read-only archive
								</Typography>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									This community is closed. Its active
									membership list remains readable, but
									invitations and member administration are
									disabled.
								</Typography>
							</View>
						</Card>
					) : null}
					{context.capabilities.canInviteMembers ? (
						<TurndownButton onPress={onInvite}>
							Invite people
						</TurndownButton>
					) : null}
					{isActiveOrganizer ? (
						<Card>
							<View style={styles.section}>
								<Typography size='H2'>
									Leaving as Organizer
								</Typography>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									Transfer ownership to an active member
									below, or close the community from Community
									settings before leaving.
								</Typography>
								<TurndownButton
									variant='Outline'
									onPress={onSettings}
								>
									Community settings
								</TurndownButton>
							</View>
						</Card>
					) : context.capabilities.canLeaveCommunity ? (
						<TurndownButton
							variant='Outline'
							tone='Error'
							disabled={actionKey !== null}
							loading={actionKey === 'Leave'}
							onPress={() => confirmLeave(onLeave)}
						>
							Leave community
						</TurndownButton>
					) : null}
					{actionMessage ? (
						<View accessibilityLiveRegion='polite'>
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								{actionMessage}
							</Typography>
						</View>
					) : null}
					<View accessibilityRole='header'>
						<Typography size='H2'>Active members</Typography>
					</View>
					{members.length === 0 ? (
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							No active members are available.
						</Typography>
					) : null}
				</>
			)}
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
			onScrollPositionChange={onScrollPositionChange}
			data={members}
			keyExtractor={(member) => member.userId}
			ListHeaderComponent={header}
			ItemSeparatorComponent={() => <View style={styles.separator} />}
			renderItem={({ item: member }) => {
				const isCurrentUser = member.userId === currentUserId;
				const canAdministerMember =
					canManage && member.role === 'Member' && !isCurrentUser;
				return (
					<Card testID={`community-member-${member.userId}`}>
						<View style={styles.section}>
							<Typography size='H3'>
								{member.displayName || 'Name unavailable'}
								{isCurrentUser ? ' (You)' : ''}
							</Typography>
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								{member.role}
							</Typography>
							{canAdministerMember ? (
								<View style={styles.actions}>
									<TurndownButton
										variant='Outline'
										disabled={actionKey !== null}
										loading={
											actionKey ===
											`Transfer:${member.userId}`
										}
										onPress={() =>
											confirmTransfer(member, onTransfer)
										}
									>
										Transfer ownership
									</TurndownButton>
									<TurndownButton
										variant='Outline'
										tone='Error'
										disabled={actionKey !== null}
										loading={
											actionKey ===
											`Remove:${member.userId}`
										}
										onPress={() =>
											confirmRemoval(member, onRemove)
										}
									>
										Remove member
									</TurndownButton>
								</View>
							) : null}
						</View>
					</Card>
				);
			}}
			ListFooterComponent={
				isReady && membersState.nextCursor ? (
					<View style={styles.footer}>
						{membersState.loadMoreError ? (
							<View accessibilityLiveRegion='polite'>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									We couldn’t load more members. Try again.
								</Typography>
							</View>
						) : null}
						<TurndownButton
							variant='Outline'
							loading={membersState.isLoadingMore}
							disabled={membersState.isLoadingMore}
							onPress={onLoadMore}
						>
							Load more members
						</TurndownButton>
					</View>
				) : null
			}
			testID='community-members-screen'
		/>
	);
};

const permissionChangeReasons = new Set([
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'AccountUnavailable',
	'CommunityUnavailable',
	'CommunityClosed',
	'OrganizerRequired',
	'MemberUnavailable',
	'OrganizerTransferRequired',
	'RevisionConflict',
]);

export const CommunityMembersContent = ({
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
	const canReadMembers =
		context.state.status === 'Ready' &&
		context.state.context.capabilities.canReadMembers;
	const members = useCommunityMembers(userId, communityId, canReadMembers);
	const [actionKey, setActionKey] = useState<string | null>(null);
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	const [hasLeft, setHasLeft] = useState(false);
	const operationIds = useRef(new Map<string, string>());
	const actionGeneration = useRef(0);
	const actionInFlight = useRef(false);

	useEffect(() => {
		return () => {
			actionGeneration.current += 1;
			actionInFlight.current = false;
		};
	}, []);

	const refresh = () => {
		context.retry();
		members.refresh();
	};
	const operationId = (key: string): string => {
		const current = operationIds.current.get(key);
		if (current) return current;
		const created = createCommunityAdministrationOperationId();
		operationIds.current.set(key, created);
		return created;
	};
	const runAction = async (
		key: string,
		action: 'Leave' | 'Remove' | 'Transfer',
		request: (id: string) => Promise<unknown>,
		onSuccess: () => void,
	) => {
		if (actionInFlight.current || !userId || !communityId) return;
		actionInFlight.current = true;
		const generation = actionGeneration.current;
		setActionKey(key);
		setActionMessage(null);
		try {
			await request(operationId(key));
			if (generation !== actionGeneration.current) return;
			operationIds.current.delete(key);
			onSuccess();
		} catch (error: unknown) {
			if (generation !== actionGeneration.current) return;
			const reason = getCommunityAdministrationReason(error);
			if (reason && permissionChangeReasons.has(reason)) {
				operationIds.current.delete(key);
				setActionMessage(
					'The community or your permissions changed. The latest information is loading.',
				);
				refresh();
			} else
				setActionMessage(
					`We couldn’t confirm this ${action.toLowerCase()} request. Check your connection and try again.`,
				);
		} finally {
			if (generation === actionGeneration.current) {
				actionInFlight.current = false;
				setActionKey(null);
			}
		}
	};
	const currentContext =
		context.state.status === 'Ready' ? context.state.context : null;
	const remove = (member: ICommunityMemberSummary) => {
		if (!communityId || !currentContext?.capabilities.canManageMembers)
			return;
		const key = `Remove:${member.userId}`;
		void runAction(
			key,
			'Remove',
			(id) =>
				removeCommunityMember({
					communityId,
					memberUserId: member.userId,
					privateReason:
						'Membership ended by the community organizer.',
					operationId: id,
				}),
			() => {
				setActionMessage(`${confirmationName(member)} was removed.`);
				refresh();
			},
		);
	};
	const transfer = (member: ICommunityMemberSummary) => {
		if (!communityId || !currentContext?.capabilities.canManageMembers)
			return;
		const expectedRevision = currentContext.communityRevision;
		const key = `Transfer:${member.userId}`;
		void runAction(
			key,
			'Transfer',
			(id) =>
				transferCommunityOrganizer({
					communityId,
					nextOrganizerUserId: member.userId,
					expectedRevision,
					operationId: id,
				}),
			() => {
				setActionMessage(
					`Ownership was transferred to ${confirmationName(member)}.`,
				);
				refresh();
			},
		);
	};
	const leave = () => {
		if (!communityId || !currentContext?.capabilities.canLeaveCommunity)
			return;
		void runAction(
			'Leave',
			'Leave',
			(id) => leaveCommunity({ communityId, operationId: id }),
			() => {
				setHasLeft(true);
				router.replace('/communities');
			},
		);
	};
	const retry = () => {
		context.retry();
		members.refresh();
	};
	return (
		<CommunityMembersView
			contextState={hasLeft ? { status: 'Unavailable' } : context.state}
			membersState={hasLeft ? { status: 'Unavailable' } : members.state}
			currentUserId={userId}
			headerHeight={headerHeight}
			actionKey={actionKey}
			actionMessage={actionMessage}
			onRetry={retry}
			onLoadMore={members.loadMore}
			onReturn={() => router.replace('/communities')}
			onInvite={() =>
				communityId &&
				router.push({
					pathname: '/communities/[communityId]/invite',
					params: { communityId },
				})
			}
			onSettings={() =>
				communityId &&
				router.push({
					pathname: '/communities/[communityId]/settings',
					params: { communityId },
				})
			}
			onLeave={leave}
			onRemove={remove}
			onTransfer={transfer}
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
		/>
	);
};

export const CommunityMembersScreen = () => {
	const { communityId } = useLocalSearchParams<{ communityId?: string }>();
	const { account } = useAuth();
	const userId = account?.userId ?? null;
	return (
		<CommunityMembersContent
			key={`${userId ?? 'signed-out'}:${communityId ?? 'missing'}`}
			userId={userId}
			communityId={communityId}
		/>
	);
};
