import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { ICommunityContext } from '@td/types/community/community.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { View } from 'react-native';
import {
	type TCommunityContextState,
	useCommunityContext,
} from '../use-community-context.hook';
import { communityStyles as styles } from './community.styles';

const memberCountLabel = ({ activeMemberCount }: ICommunityContext): string => {
	const suffix = activeMemberCount.isExact ? '' : '+';
	const noun = activeMemberCount.value === 1 ? 'member' : 'members';
	return `${activeMemberCount.value}${suffix} ${noun}`;
};

interface ICommunityHomeProps {
	state: TCommunityContextState;
	onRetry: () => void;
	onReturn: () => void;
	onInvite: (communityId: string) => void;
	onMembers: (communityId: string) => void;
}

export const CommunityHome = ({
	state,
	onRetry,
	onReturn,
	onInvite,
	onMembers,
}: ICommunityHomeProps) => {
	if (state.status === 'Loading') {
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
				accessibilityState={{ busy: true }}
			>
				<Typography size='H1'>Loading your community…</Typography>
			</View>
		);
	}

	if (state.status === 'Unavailable') {
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
			>
				<View accessibilityRole='header'>
					<Typography size='H1'>
						This community is unavailable
					</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Your membership may have changed, or this community may no
					longer be available to your account.
				</Typography>
				<TurndownButton
					variant='Outline'
					onPress={onReturn}
				>
					Your communities
				</TurndownButton>
			</View>
		);
	}

	if (state.status === 'Error') {
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
			>
				<View accessibilityRole='header'>
					<Typography size='H1'>
						We couldn’t load this community.
					</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Check your connection and try again.
				</Typography>
				<View style={styles.actions}>
					<TurndownButton onPress={onRetry}>Try again</TurndownButton>
					<TurndownButton
						variant='Outline'
						onPress={onReturn}
					>
						Your communities
					</TurndownButton>
				</View>
			</View>
		);
	}

	const { context } = state;
	const { community, membership } = context;
	const isOrganizerAlone =
		community.status === 'Active' &&
		membership.role === 'Organizer' &&
		context.capabilities.canInviteMembers &&
		context.activeMemberCount.isExact &&
		context.activeMemberCount.value === 1;
	const canInvite =
		community.status === 'Active' &&
		membership.role === 'Organizer' &&
		context.capabilities.canInviteMembers;

	return (
		<View style={styles.content}>
			<View style={styles.section}>
				<View accessibilityRole='header'>
					<Typography size='Display'>{community.name}</Typography>
				</View>
				{community.purpose ? (
					<Typography
						tone='Secondary'
						weight='Regular'
					>
						{community.purpose}
					</Typography>
				) : null}
			</View>

			<Card>
				<View style={styles.details}>
					<Typography size='H2'>Private community</Typography>
					<Typography
						tone='Secondary'
						weight='Regular'
					>
						{community.organizer.displayName
							? `Organized by ${community.organizer.displayName}`
							: 'Organizer name unavailable'}
					</Typography>
					<Typography weight='Regular'>
						Your role: {membership.role}
					</Typography>
					<Typography weight='Regular'>
						{memberCountLabel(context)}
					</Typography>
				</View>
			</Card>

			{community.participationExpectations ? (
				<View style={styles.section}>
					<View accessibilityRole='header'>
						<Typography size='H2'>How we participate</Typography>
					</View>
					<Typography
						tone='Secondary'
						weight='Regular'
					>
						{community.participationExpectations}
					</Typography>
				</View>
			) : null}

			{community.status === 'Closed' ? (
				<Card>
					<View style={styles.details}>
						<Typography size='H2'>Read-only archive</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							This community is closed. Members can still read its
							available community content, but no new activity can
							be added.
						</Typography>
					</View>
				</Card>
			) : isOrganizerAlone ? (
				<Card>
					<View style={styles.details}>
						<Typography size='H2'>
							Invite people when you’re ready
						</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							You’re the only member. The next step is inviting
							people you know.
						</Typography>
						<TurndownButton
							onPress={() => onInvite(community.communityId)}
						>
							Invite people
						</TurndownButton>
					</View>
				</Card>
			) : null}

			{canInvite && !isOrganizerAlone ? (
				<TurndownButton
					variant='Outline'
					onPress={() => onInvite(community.communityId)}
				>
					Invite people
				</TurndownButton>
			) : null}

			<TurndownButton
				variant='Outline'
				onPress={() => onMembers(community.communityId)}
			>
				Members
			</TurndownButton>

			<Typography
				size='Body2'
				tone='Secondary'
				weight='Regular'
			>
				Membership does not share your private reflections, practice
				choices, completion, or personal journey.
			</Typography>
			<TurndownButton
				variant='Outline'
				onPress={onReturn}
			>
				Your communities
			</TurndownButton>
		</View>
	);
};

const CommunityDetails = ({
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
	const { state, retry } = useCommunityContext(userId, communityId);
	const returnToCommunities = () => router.replace('/communities');
	const openInvitations = (selectedCommunityId: string) =>
		router.push({
			pathname: '/communities/[communityId]/invite',
			params: { communityId: selectedCommunityId },
		});
	const openMembers = (selectedCommunityId: string) =>
		router.push({
			pathname: '/communities/[communityId]/members',
			params: { communityId: selectedCommunityId },
		});

	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			keyboardEnabled={false}
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			testID='community-screen'
		>
			<View style={{ paddingTop: headerHeight }}>
				<CommunityHome
					state={state}
					onRetry={retry}
					onReturn={returnToCommunities}
					onInvite={openInvitations}
					onMembers={openMembers}
				/>
			</View>
		</TurndownScrollScreen>
	);
};

export const CommunityScreen = () => {
	const { communityId } = useLocalSearchParams<{ communityId?: string }>();
	const { account } = useAuth();
	const userId = account?.userId ?? null;
	return (
		<CommunityDetails
			key={`${userId ?? 'signed-out'}:${communityId ?? 'missing'}`}
			userId={userId}
			communityId={communityId}
		/>
	);
};
