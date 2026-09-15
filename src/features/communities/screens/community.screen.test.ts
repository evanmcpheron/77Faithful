import type { ICommunityPost } from '@td/types/community/community-post.types';
import type { ICommunityContext } from '@td/types/community/community.types';
import { createElement, type ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	CommunityHome,
	CommunityPostCard,
	CommunityScreen,
} from './community.screen';

const mockRouterPush = jest.fn();
let mockScreenContextState: unknown = { status: 'Loading' };
let mockScreenFeedState: unknown = { status: 'Loading' };

jest.mock('expo-router', () => ({
	useFocusEffect: (effect: () => void | (() => void)) => {
		const React = jest.requireActual('react') as typeof import('react');
		React.useEffect(effect, [effect]);
	},
	useLocalSearchParams: () => ({ communityId: 'group' }),
	useRouter: () => ({ replace: jest.fn(), push: mockRouterPush }),
}));
jest.mock('../community-journey-schedule.service', () => ({
	getCommunityJourneySchedule: () =>
		Promise.resolve({ communityJourney: null }),
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({ account: { userId: 'owner' } }),
}));
jest.mock('@td/providers/header-scroll/use-screen-scroll-offset.hook', () => ({
	useScreenScrollOffset: () => ({
		scrollOffset: { value: 0 },
		handleScrollPositionChange: jest.fn(),
	}),
}));
jest.mock('../use-community-context.hook', () => ({
	useCommunityContext: () => ({
		state: mockScreenContextState,
		retry: jest.fn(),
	}),
}));
jest.mock('../use-community-feed.hook', () => ({
	useCommunityFeed: () => ({
		state: mockScreenFeedState,
		refresh: jest.fn(),
		loadMore: jest.fn(),
	}),
}));
jest.mock('react-native', () => ({ View: 'View' }));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownListScreen: ({
		ListHeaderComponent,
		ListFooterComponent,
		data,
		renderItem,
		...props
	}: {
		ListHeaderComponent?: ReactNode;
		ListFooterComponent?: ReactNode;
		data?: unknown[];
		renderItem?: (info: { item: unknown; index: number }) => ReactNode;
	}) =>
		createElement(
			'Screen',
			props,
			ListHeaderComponent,
			...(data ?? []).map((item, index) => renderItem?.({ item, index })),
			ListFooterComponent,
		),
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'Button',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'Card' }));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const communityContext = ({
	role,
	memberCount,
	status = 'Active',
}: {
	role: 'Organizer' | 'Member';
	memberCount: number;
	status?: 'Active' | 'Closed';
}): ICommunityContext => ({
	community: {
		communityId: 'group',
		name: 'Grace Church',
		purpose: 'Pray together each week.',
		organizer: { userId: 'owner', displayName: 'Anna' },
		participationExpectations: 'Listen with care.',
		status,
	},
	communityRevision: 4,
	membership: {
		communityId: 'group',
		userId: role === 'Organizer' ? 'owner' : 'member',
		displayName: 'Reader',
		role,
		status: 'Active',
	},
	capabilities: {
		canReadMembers: true,
		canCreatePost: status === 'Active',
		canInviteMembers: role === 'Organizer' && status === 'Active',
		canManageMembers: role === 'Organizer' && status === 'Active',
		canEditCommunity: role === 'Organizer' && status === 'Active',
		canCloseCommunity: role === 'Organizer' && status === 'Active',
		canLeaveCommunity: true,
	},
	activeMemberCount: { value: memberCount, isExact: true },
});

const post = ({
	postId,
	seconds,
	publication,
	replyCount = 0,
	edited = false,
}: {
	postId: string;
	seconds: number;
	publication: ICommunityPost['publication'];
	replyCount?: number;
	edited?: boolean;
}): ICommunityPost => ({
	schemaVersion: 1,
	communityId: 'group',
	postId,
	author: { userId: 'member', displayName: 'Jordan' },
	revision: 2,
	replyCount,
	createdAt: { seconds, nanoseconds: 0 },
	updatedAt: { seconds, nanoseconds: 0 },
	editedAt: edited ? { seconds: seconds + 1, nanoseconds: 0 } : null,
	publication,
});

const readyFeed = (
	posts: ICommunityPost[],
	overrides: Partial<{
		nextCursor: string | null;
		loadMoreError: boolean;
	}> = {},
) => ({
	status: 'Ready' as const,
	posts,
	nextCursor: overrides.nextCursor ?? null,
	prayerSupport: {},
	isRefreshing: false,
	refreshError: false,
	isLoadingMore: false,
	loadMoreError: overrides.loadMoreError ?? false,
});

let renderer: ReactTestRenderer;
const actions = {
	onRetry: jest.fn(),
	onRefresh: jest.fn(),
	onLoadMore: jest.fn(),
	onReturn: jest.fn(),
	onInvite: jest.fn(),
	onMembers: jest.fn(),
	onSettings: jest.fn(),
	onSchedule: jest.fn(),
	onCompose: jest.fn(),
	onPost: jest.fn(),
};

it('offers schedule navigation in the organizer no-journey state', () => {
	act(() => {
		renderer = create(
			createElement(CommunityHome, {
				contextState: {
					status: 'Ready',
					context: communityContext({
						role: 'Organizer',
						memberCount: 2,
					}),
				},
				feedState: readyFeed([]),
				headerHeight: 80,
				...actions,
				noJourney: true,
				scrollOffset: { value: 0 } as never,
				onScrollPositionChange: jest.fn(),
			}),
		);
	});
	act(() =>
		renderer.root
			.findByProps({ testID: 'community-home-schedule' })
			.props['onPress'](),
	);
	expect(actions.onSchedule).toHaveBeenCalledWith('group');
});
const mount = (
	contextState: React.ComponentProps<typeof CommunityHome>['contextState'],
	feedState: React.ComponentProps<typeof CommunityHome>['feedState'],
) => {
	act(() => {
		renderer = create(
			createElement(CommunityHome, {
				contextState,
				feedState,
				headerHeight: 80,
				...actions,
				scrollOffset: { value: 0 } as never,
				onScrollPositionChange: jest.fn(),
			}),
		);
	});
};
const renderedText = () => JSON.stringify(renderer.toJSON());
const press = (label: string) => {
	const button = renderer.root.find(
		(node) =>
			String(node.type) === 'Button' && node.props['children'] === label,
	);
	act(() => button.props['onPress']());
};

beforeEach(() => {
	jest.clearAllMocks();
	mockScreenContextState = { status: 'Loading' };
	mockScreenFeedState = { status: 'Loading' };
});
afterEach(() => act(() => renderer.unmount()));

it('renders a truthful empty feed and prominent organizer invitation', () => {
	mount(
		{
			status: 'Ready',
			context: communityContext({ role: 'Organizer', memberCount: 1 }),
		},
		readyFeed([]),
	);
	expect(renderedText()).toContain('No posts have been shared');
	expect(renderedText()).toContain('Invite people when you’re ready');
	expect(renderedText()).toContain(
		'reflection, prayer request, or discussion',
	);
	press('Write a post');
	expect(actions.onCompose).toHaveBeenCalledWith('group');
});

it('keeps invite, members, and settings entry points without displacing posts', () => {
	const discussion = post({
		postId: 'post-1',
		seconds: 2,
		publication: {
			status: 'Published',
			content: { postType: 'Discussion', text: 'Welcome.' },
		},
	});
	mount(
		{
			status: 'Ready',
			context: communityContext({ role: 'Organizer', memberCount: 1 }),
		},
		readyFeed([discussion]),
	);
	expect(renderedText()).not.toContain('Invite people when you’re ready');
	expect(
		renderer.root.findByProps({ testID: 'community-post-post-1' }),
	).toBeTruthy();
	press('Invite people');
	press('Members');
	press('Community settings');
	expect(actions.onInvite).toHaveBeenCalledWith('group');
	expect(actions.onMembers).toHaveBeenCalledWith('group');
	expect(actions.onSettings).toHaveBeenCalledWith('group');
	act(() =>
		renderer.root
			.findByProps({ testID: 'community-post-post-1' })
			.find(
				(node) =>
					String(node.type) === 'Card' &&
					Boolean(node.props['onPress']),
			)
			.props['onPress'](),
	);
	expect(actions.onPost).toHaveBeenCalledWith('group', 'post-1');
});

it('shows real prayer state, reply/support information, and an accessible label', () => {
	const prayer = post({
		postId: 'prayer-1',
		seconds: 3,
		replyCount: 2,
		edited: true,
		publication: {
			status: 'Published',
			content: {
				postType: 'PrayerRequest',
				text: 'Please pray for wisdom.',
				prayerRequestStatus: 'Answered',
			},
		},
	});
	act(() => {
		renderer = create(
			createElement(CommunityPostCard, {
				post: prayer,
				support: { supportCount: 3, viewerIsPraying: true },
			}),
		);
	});
	const card = renderer.root.findByProps({
		testID: 'community-post-prayer-1',
	});
	expect(card.props['accessibilityLabel']).toContain('Marked answered');
	expect(card.props['accessibilityLabel']).toContain('2 replies');
	expect(card.props['accessibilityLabel']).toContain(
		'3 people are praying, including you',
	);
	expect(renderedText()).toContain('Edited');
});

it('renders long text without a line clamp and preserves text-free tombstones', () => {
	const longText = 'A long community reflection '.repeat(80);
	const published = post({
		postId: 'long',
		seconds: 4,
		publication: {
			status: 'Published',
			content: { postType: 'SharedReflectionCopy', text: longText },
		},
	});
	act(() => {
		renderer = create(
			createElement(CommunityPostCard, { post: published }),
		);
	});
	const text = renderer.root.findByProps({ children: longText });
	expect(text.props['numberOfLines']).toBeUndefined();
	act(() => renderer.unmount());

	const tombstone = post({
		postId: 'deleted',
		seconds: 3,
		publication: {
			status: 'AuthorDeleted',
			postType: 'Discussion',
			deletedAt: { seconds: 5, nanoseconds: 0 },
		},
	});
	act(() => {
		renderer = create(
			createElement(CommunityPostCard, { post: tombstone }),
		);
	});
	expect(renderedText()).toContain('Post deleted by its author.');
	expect(renderedText()).not.toContain('A long community reflection');
});

it('keeps a closed archive readable and suppresses composer controls', () => {
	const discussion = post({
		postId: 'post-1',
		seconds: 2,
		publication: {
			status: 'Published',
			content: { postType: 'Discussion', text: 'Archive conversation.' },
		},
	});
	mount(
		{
			status: 'Ready',
			context: communityContext({
				role: 'Organizer',
				memberCount: 3,
				status: 'Closed',
			}),
		},
		readyFeed([discussion]),
	);
	expect(renderedText()).toContain('Read-only archive');
	expect(renderedText()).toContain('Archive conversation.');
	expect(renderedText()).not.toContain('Write a post');
});

it('keeps load-more failure independently retryable', () => {
	mount(
		{
			status: 'Ready',
			context: communityContext({ role: 'Member', memberCount: 3 }),
		},
		readyFeed([], { nextCursor: 'cursor', loadMoreError: true }),
	);
	expect(renderedText()).toContain('couldn’t load more posts');
	press('Load more posts');
	expect(actions.onLoadMore).toHaveBeenCalledTimes(1);
});

it('clears feed records when membership becomes unavailable', () => {
	mount(
		{
			status: 'Ready',
			context: communityContext({ role: 'Member', memberCount: 3 }),
		},
		{ status: 'Unavailable' },
	);
	expect(renderedText()).toContain('This community is unavailable');
	expect(
		renderer.root.findAllByProps({ testID: 'community-post-post-1' }),
	).toHaveLength(0);
});

it('navigates from a real home feed card to the post conversation route', () => {
	const discussion = post({
		postId: 'post-1',
		seconds: 2,
		publication: {
			status: 'Published',
			content: { postType: 'Discussion', text: 'Open this post.' },
		},
	});
	mockScreenContextState = {
		status: 'Ready',
		context: communityContext({ role: 'Organizer', memberCount: 2 }),
	};
	mockScreenFeedState = readyFeed([discussion]);
	act(() => {
		renderer = create(createElement(CommunityScreen));
	});
	act(() =>
		renderer.root
			.findByProps({ testID: 'community-post-post-1' })
			.find(
				(node) =>
					String(node.type) === 'Card' &&
					Boolean(node.props['onPress']),
			)
			.props['onPress'](),
	);
	expect(mockRouterPush).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]/posts/[postId]',
		params: { communityId: 'group', postId: 'post-1' },
	});
});
