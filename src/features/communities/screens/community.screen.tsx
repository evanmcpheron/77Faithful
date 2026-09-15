import { TurndownListScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { ICommunityPost } from '@td/types/community/community-post.types';
import type { ICommunityContext } from '@td/types/community/community.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
	type TCommunityContextState,
	useCommunityContext,
} from '../use-community-context.hook';
import {
	type ICommunityPrayerSupportSummary,
	type TCommunityFeedState,
	useCommunityFeed,
} from '../use-community-feed.hook';
import { communityStyles as styles } from './community.styles';

const postTypeLabels = {
	PrayerRequest: 'Prayer request',
	Discussion: 'Discussion',
	OrganizerAnnouncement: 'Announcement',
	SharedReflectionCopy: 'Shared reflection',
} as const;

const prayerStatusLabels = {
	Current: 'Current prayer request',
	NoLongerCurrent: 'No longer current',
	Answered: 'Marked answered',
} as const;

const memberCountLabel = ({ activeMemberCount }: ICommunityContext): string => {
	const suffix = activeMemberCount.isExact ? '' : '+';
	const noun = activeMemberCount.value === 1 ? 'member' : 'members';
	return `${activeMemberCount.value}${suffix} ${noun}`;
};

const formatPostDate = (post: ICommunityPost): string =>
	new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(
		new Date(
			post.createdAt.seconds * 1_000 +
				Math.floor(post.createdAt.nanoseconds / 1_000_000),
		),
	);

const replyLabel = (post: ICommunityPost): string => {
	const count = post.replyCount ?? 0;
	return `${count} ${count === 1 ? 'reply' : 'replies'}`;
};

const supportLabel = (
	support: ICommunityPrayerSupportSummary | undefined,
): string => {
	if (!support) return 'Prayer support unavailable';
	const noun = support.supportCount === 1 ? 'person is' : 'people are';
	return `${support.supportCount} ${noun} praying${support.viewerIsPraying ? ', including you' : ''}`;
};

interface ICommunityPostCardProps {
	post: ICommunityPost;
	support?: ICommunityPrayerSupportSummary | undefined;
	onPress?: (() => void) | undefined;
}

export const CommunityPostCard = ({
	post,
	support,
	onPress,
}: ICommunityPostCardProps) => {
	const publication = post.publication;
	const type =
		publication.status === 'Published'
			? publication.content.postType
			: publication.postType;
	const typeLabel = postTypeLabels[type];
	const createdLabel = formatPostDate(post);
	const editedLabel = post.editedAt ? ' · Edited' : '';
	const statusLabel =
		publication.status === 'AuthorDeleted'
			? 'Post deleted by its author.'
			: publication.status === 'ModeratorRemoved'
				? 'Post removed by a moderator.'
				: null;
	const prayerStatus =
		publication.status === 'Published' &&
		publication.content.postType === 'PrayerRequest'
			? prayerStatusLabels[publication.content.prayerRequestStatus]
			: null;
	const accessibleSummary = [
		typeLabel,
		`by ${post.author.displayName || 'Name unavailable'}`,
		createdLabel,
		post.editedAt ? 'Edited' : null,
		statusLabel ??
			(publication.status === 'Published'
				? publication.content.text
				: null),
		prayerStatus,
		replyLabel(post),
		type === 'PrayerRequest' && publication.status === 'Published'
			? supportLabel(support)
			: null,
	]
		.filter(Boolean)
		.join('. ');

	return (
		<View
			accessible
			accessibilityLabel={accessibleSummary}
			testID={`community-post-${post.postId}`}
		>
			<Card {...(onPress ? { onPress } : {})}>
				<View style={styles.cardContent}>
					<View style={styles.cardHeading}>
						<Typography
							size='H3'
							style={styles.cardHeadingText}
						>
							{typeLabel}
						</Typography>
						<Typography
							size='Body2'
							tone='Secondary'
							weight='Regular'
						>
							{createdLabel}
							{editedLabel}
						</Typography>
					</View>
					<Typography weight='Semibold'>
						{post.author.displayName || 'Name unavailable'}
					</Typography>
					{statusLabel ? (
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							{statusLabel}
						</Typography>
					) : publication.status === 'Published' ? (
						<Typography
							weight='Regular'
							style={styles.postText}
						>
							{publication.content.text}
						</Typography>
					) : null}
					{prayerStatus ? (
						<Typography
							size='Body2'
							tone='Secondary'
							weight='Semibold'
						>
							{prayerStatus}
						</Typography>
					) : null}
					<View style={styles.cardMeta}>
						<Typography
							size='Body2'
							tone='Secondary'
							weight='Regular'
						>
							{replyLabel(post)}
						</Typography>
						{type === 'PrayerRequest' &&
						publication.status === 'Published' ? (
							<Typography
								size='Body2'
								tone='Secondary'
								weight='Regular'
							>
								{supportLabel(support)}
							</Typography>
						) : null}
					</View>
				</View>
			</Card>
		</View>
	);
};

interface ICommunityHomeProps {
	contextState: TCommunityContextState;
	feedState: TCommunityFeedState;
	headerHeight: number;
	successMessage?: string | null;
	onRetry: () => void;
	onRefresh: () => void;
	onLoadMore: () => void;
	onReturn: () => void;
	onInvite: (communityId: string) => void;
	onMembers: (communityId: string) => void;
	onSettings: (communityId: string) => void;
	onCompose: (communityId: string) => void;
	onPost: (communityId: string, postId: string) => void;
	scrollOffset: SharedValue<number>;
	onScrollPositionChange: (y: number) => void;
}

const CommunityUnavailable = ({ onReturn }: { onReturn: () => void }) => (
	<View
		style={styles.section}
		accessibilityLiveRegion='polite'
	>
		<View accessibilityRole='header'>
			<Typography size='H1'>This community is unavailable</Typography>
		</View>
		<Typography
			tone='Secondary'
			weight='Regular'
		>
			Your membership may have changed, or this community may no longer be
			available to your account.
		</Typography>
		<TurndownButton
			variant='Outline'
			onPress={onReturn}
		>
			Your communities
		</TurndownButton>
	</View>
);

export const CommunityHome = ({
	contextState,
	feedState,
	headerHeight,
	successMessage,
	onRetry,
	onRefresh,
	onLoadMore,
	onReturn,
	onInvite,
	onMembers,
	onSettings,
	onCompose,
	onPost,
	scrollOffset,
	onScrollPositionChange,
}: ICommunityHomeProps) => {
	const isUnavailable =
		contextState.status === 'Unavailable' ||
		feedState.status === 'Unavailable';
	const isLoading =
		contextState.status === 'Loading' ||
		feedState.status === 'Idle' ||
		feedState.status === 'Loading';
	const hasError =
		contextState.status === 'Error' || feedState.status === 'Error';
	const ready =
		contextState.status === 'Ready' && feedState.status === 'Ready';
	const context = ready ? contextState.context : null;
	const posts = ready ? feedState.posts : [];
	const isOrganizerAlone = Boolean(
		context?.community.status === 'Active' &&
		context.membership.role === 'Organizer' &&
		context.capabilities.canInviteMembers &&
		context.activeMemberCount.isExact &&
		context.activeMemberCount.value === 1,
	);
	const showProminentInvite = isOrganizerAlone && posts.length === 0;
	const canInvite = Boolean(
		context?.community.status === 'Active' &&
		context.membership.role === 'Organizer' &&
		context.capabilities.canInviteMembers,
	);

	const header = (
		<View style={[styles.content, { paddingTop: headerHeight }]}>
			{isUnavailable ? (
				<CommunityUnavailable onReturn={onReturn} />
			) : isLoading ? (
				<View
					style={styles.section}
					accessibilityLiveRegion='polite'
					accessibilityState={{ busy: true }}
				>
					<Typography size='H1'>Loading your community…</Typography>
				</View>
			) : hasError ? (
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
						<TurndownButton onPress={onRetry}>
							Try again
						</TurndownButton>
						<TurndownButton
							variant='Outline'
							onPress={onReturn}
						>
							Your communities
						</TurndownButton>
					</View>
				</View>
			) : context ? (
				<>
					{successMessage ? (
						<View
							accessibilityRole='alert'
							accessibilityLiveRegion='polite'
						>
							<Typography weight='Semibold'>
								{successMessage}
							</Typography>
						</View>
					) : null}
					<View style={styles.section}>
						<View accessibilityRole='header'>
							<Typography size='Display'>
								{context.community.name}
							</Typography>
						</View>
						{context.community.purpose ? (
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								{context.community.purpose}
							</Typography>
						) : null}
						<Typography
							size='Body2'
							tone='Secondary'
							weight='Regular'
						>
							Organized by{' '}
							{context.community.organizer.displayName ||
								'Name unavailable'}{' '}
							· {memberCountLabel(context)} · Your role:{' '}
							{context.membership.role}
						</Typography>
					</View>

					{context.community.status === 'Closed' ? (
						<Card>
							<View style={styles.details}>
								<Typography size='H2'>
									Read-only archive
								</Typography>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									This community is closed. Members can still
									read its available posts, but no new
									activity can be added.
								</Typography>
							</View>
						</Card>
					) : context.capabilities.canCreatePost ? (
						<Card>
							<View style={styles.details}>
								<Typography size='H2'>
									Share with this community
								</Typography>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									Create a reflection, prayer request, or
									discussion
									{context.membership.role === 'Organizer'
										? ', or share an announcement.'
										: '.'}
								</Typography>
								<TurndownButton
									onPress={() =>
										onCompose(context.community.communityId)
									}
								>
									Write a post
								</TurndownButton>
							</View>
						</Card>
					) : null}

					{showProminentInvite ? (
						<Card>
							<View style={styles.details}>
								<Typography size='H2'>
									Invite people when you’re ready
								</Typography>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									You’re the only member. Invite people you
									know to join the conversation.
								</Typography>
								<TurndownButton
									onPress={() =>
										onInvite(context.community.communityId)
									}
								>
									Invite people
								</TurndownButton>
							</View>
						</Card>
					) : canInvite ? (
						<TurndownButton
							variant='Outline'
							onPress={() =>
								onInvite(context.community.communityId)
							}
						>
							Invite people
						</TurndownButton>
					) : null}

					<View style={styles.navigationActions}>
						<TurndownButton
							variant='Outline'
							onPress={() =>
								onMembers(context.community.communityId)
							}
						>
							Members
						</TurndownButton>
						<TurndownButton
							variant='Outline'
							onPress={() =>
								onSettings(context.community.communityId)
							}
						>
							Community settings
						</TurndownButton>
					</View>

					{context.community.participationExpectations ? (
						<View style={styles.section}>
							<View accessibilityRole='header'>
								<Typography size='H2'>
									How we participate
								</Typography>
							</View>
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								{context.community.participationExpectations}
							</Typography>
						</View>
					) : null}

					<Typography
						size='Body2'
						tone='Secondary'
						weight='Regular'
					>
						Membership does not share your private reflections,
						practice choices, completion, or personal journey. Only
						text you deliberately submit here becomes a community
						post.
					</Typography>
					<View accessibilityRole='header'>
						<Typography size='H2'>Conversation</Typography>
					</View>
					{feedState.status === 'Ready' && feedState.refreshError ? (
						<View accessibilityLiveRegion='polite'>
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								We couldn’t refresh the conversation. The posts
								below are still available.
							</Typography>
						</View>
					) : null}
					{posts.length === 0 ? (
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							No posts have been shared with this community yet.
						</Typography>
					) : null}
				</>
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
			onScrollPositionChange={onScrollPositionChange}
			data={posts}
			keyExtractor={(post) => post.postId}
			ListHeaderComponent={header}
			ItemSeparatorComponent={() => <View style={styles.separator} />}
			renderItem={({ item }) => (
				<CommunityPostCard
					post={item}
					onPress={() => onPost(item.communityId, item.postId)}
					support={
						feedState.status === 'Ready'
							? feedState.prayerSupport[item.postId]
							: undefined
					}
				/>
			)}
			refreshing={ready ? feedState.isRefreshing : false}
			onRefresh={ready ? onRefresh : undefined}
			ListFooterComponent={
				ready ? (
					<View style={styles.footer}>
						{feedState.loadMoreError ? (
							<View accessibilityLiveRegion='polite'>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									We couldn’t load more posts. Try again.
								</Typography>
							</View>
						) : null}
						{feedState.nextCursor ? (
							<TurndownButton
								variant='Outline'
								loading={feedState.isLoadingMore}
								disabled={feedState.isLoadingMore}
								onPress={onLoadMore}
							>
								Load more posts
							</TurndownButton>
						) : null}
						<TurndownButton
							variant='Outline'
							onPress={onReturn}
						>
							Your communities
						</TurndownButton>
					</View>
				) : null
			}
			testID='community-screen'
		/>
	);
};

const CommunityDetails = ({
	userId,
	communityId,
	postSaved,
}: {
	userId: string | null;
	communityId: string | undefined;
	postSaved?: string;
}) => {
	const router = useRouter();
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const { state: contextState, retry: retryContext } = useCommunityContext(
		userId,
		communityId,
	);
	const canRead = contextState.status === 'Ready';
	const {
		state: feedState,
		refresh: refreshFeed,
		loadMore,
	} = useCommunityFeed(userId, communityId, canRead);
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
	const openSettings = (selectedCommunityId: string) =>
		router.push({
			pathname: '/communities/[communityId]/settings',
			params: { communityId: selectedCommunityId },
		});
	const openComposer = (selectedCommunityId: string) =>
		router.push({
			pathname: '/communities/[communityId]/posts/compose',
			params: { communityId: selectedCommunityId },
		});
	const openPost = (selectedCommunityId: string, selectedPostId: string) =>
		router.push({
			pathname: '/communities/[communityId]/posts/[postId]',
			params: {
				communityId: selectedCommunityId,
				postId: selectedPostId,
			},
		});
	const retry = () => {
		if (contextState.status === 'Error') retryContext();
		else void refreshFeed();
	};
	const successMessage =
		postSaved === 'created'
			? 'Your post was saved to this community.'
			: postSaved === 'edited'
				? 'Your changes were saved to this community.'
				: null;

	return (
		<CommunityHome
			contextState={contextState}
			feedState={feedState}
			headerHeight={headerHeight}
			successMessage={successMessage}
			onRetry={retry}
			onRefresh={() => void refreshFeed()}
			onLoadMore={() => void loadMore()}
			onReturn={returnToCommunities}
			onInvite={openInvitations}
			onMembers={openMembers}
			onSettings={openSettings}
			onCompose={openComposer}
			onPost={openPost}
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
		/>
	);
};

export const CommunityScreen = () => {
	const { communityId, postSaved } = useLocalSearchParams<{
		communityId?: string;
		postSaved?: string;
	}>();
	const { account } = useAuth();
	const userId = account?.userId ?? null;
	return (
		<CommunityDetails
			key={`${userId ?? 'signed-out'}:${communityId ?? 'missing'}`}
			userId={userId}
			communityId={communityId}
			{...(postSaved ? { postSaved } : {})}
		/>
	);
};
