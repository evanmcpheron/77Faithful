import type {
	ICommunityPost,
	ICommunityReply,
} from '@td/types/community/community-post.types';
import type { ICommunityContext } from '@td/types/community/community.types';
import { createElement, type ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CommunityPostScreen } from './community-post.screen';

const mockGetPost = jest.fn();
const mockListReplies = jest.fn();
const mockListSupport = jest.fn();
const mockCreateReply = jest.fn();
const mockEditReply = jest.fn();
const mockDeleteReply = jest.fn();
const mockDeletePost = jest.fn();
const mockSetSupport = jest.fn();
const mockSetStatus = jest.fn();
const mockGetReason = jest.fn();
const mockOperationId = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockAlert = jest.fn();
let mockContextState: { status: string; context?: ICommunityContext };
let operationNumber = 0;

const timestamp = { seconds: 10, nanoseconds: 0 };
const context = ({
	userId = 'owner',
	status = 'Active',
}: {
	userId?: string;
	status?: 'Active' | 'Closed';
} = {}): ICommunityContext => ({
	community: {
		communityId: 'group',
		name: 'Grace Church',
		purpose: '',
		organizer: { userId: 'owner', displayName: 'Anna' },
		status,
	},
	communityRevision: 1,
	membership: {
		communityId: 'group',
		userId,
		displayName: userId === 'owner' ? 'Anna' : 'Jordan',
		role: userId === 'owner' ? 'Organizer' : 'Member',
		status: 'Active',
	},
	capabilities: {
		canReadMembers: true,
		canCreatePost: status === 'Active',
		canInviteMembers: userId === 'owner' && status === 'Active',
		canManageMembers: userId === 'owner' && status === 'Active',
		canEditCommunity: userId === 'owner' && status === 'Active',
		canCloseCommunity: userId === 'owner' && status === 'Active',
		canLeaveCommunity: true,
	},
	activeMemberCount: { value: 2, isExact: true },
});

const discussion = (
	authorUserId = 'owner',
	publication: ICommunityPost['publication'] = {
		status: 'Published',
		content: {
			postType: 'Discussion',
			text: 'Welcome to the conversation.',
		},
	},
): ICommunityPost => ({
	schemaVersion: 1,
	communityId: 'group',
	postId: 'post-1',
	author: {
		userId: authorUserId,
		displayName: authorUserId === 'owner' ? 'Anna' : 'Jordan',
	},
	revision: 3,
	replyCount: 2,
	createdAt: timestamp,
	updatedAt: timestamp,
	editedAt: null,
	publication,
});

const prayer = (): ICommunityPost => ({
	...discussion(),
	publication: {
		status: 'Published',
		content: {
			postType: 'PrayerRequest',
			text: 'Please pray for wisdom.',
			prayerRequestStatus: 'Current',
		},
	},
});

const reply = (replyId: string, authorUserId = 'member'): ICommunityReply => ({
	schemaVersion: 1,
	communityId: 'group',
	postId: 'post-1',
	replyId,
	author: {
		userId: authorUserId,
		displayName: authorUserId === 'owner' ? 'Anna' : 'Jordan',
	},
	revision: 2,
	createdAt: timestamp,
	updatedAt: timestamp,
	editedAt: null,
	publication: { status: 'Published', text: `Reply ${replyId}` },
});

jest.mock('expo-router', () => {
	const React = jest.requireActual('react') as typeof import('react');
	return {
		useLocalSearchParams: () => ({
			communityId: 'group',
			postId: 'post-1',
		}),
		useRouter: () => ({ replace: mockReplace, push: mockPush }),
		useFocusEffect: (effect: () => void | (() => void)) =>
			React.useEffect(effect, [effect]),
	};
});
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({
		account: {
			userId: mockContextState.context?.membership.userId ?? 'owner',
		},
	}),
}));
jest.mock('@td/providers/header-scroll/use-screen-scroll-offset.hook', () => ({
	useScreenScrollOffset: () => ({
		scrollOffset: { value: 0 },
		handleScrollPositionChange: jest.fn(),
	}),
}));
jest.mock('../use-community-context.hook', () => ({
	useCommunityContext: () => ({ state: mockContextState, retry: jest.fn() }),
}));
jest.mock('../community-post.service', () => ({
	getCommunityPost: (...args: unknown[]) => mockGetPost(...args),
	listCommunityReplies: (...args: unknown[]) => mockListReplies(...args),
	listCommunityPrayerSupport: (...args: unknown[]) =>
		mockListSupport(...args),
	createCommunityReply: (...args: unknown[]) => mockCreateReply(...args),
	editCommunityReply: (...args: unknown[]) => mockEditReply(...args),
	deleteCommunityReply: (...args: unknown[]) => mockDeleteReply(...args),
	deleteCommunityPost: (...args: unknown[]) => mockDeletePost(...args),
	setCommunityPrayerAcknowledgment: (...args: unknown[]) =>
		mockSetSupport(...args),
	setCommunityPrayerRequestStatus: (...args: unknown[]) =>
		mockSetStatus(...args),
	getCommunityPostReason: (...args: unknown[]) => mockGetReason(...args),
	createCommunityPostOperationId: () => mockOperationId(),
}));
jest.mock('react-native', () => ({
	View: 'View',
	Pressable: 'Pressable',
	Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));
jest.mock('@td/components/form/input/input.component', () => ({
	Input: 'Input',
}));
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
let renderer: ReactTestRenderer;

const mount = async () => {
	await act(async () => {
		renderer = create(createElement(CommunityPostScreen));
	});
};
const renderedText = () => JSON.stringify(renderer.toJSON());
const field = (testID: string) => renderer.root.findByProps({ testID });
const pressButton = (label: string) =>
	act(() =>
		renderer.root
			.find(
				(node) =>
					String(node.type) === 'Button' &&
					(Array.isArray(node.props['children'])
						? node.props['children'].join('')
						: node.props['children']) === label,
			)
			.props['onPress'](),
	);

beforeEach(() => {
	jest.clearAllMocks();
	operationNumber = 0;
	mockContextState = { status: 'Ready', context: context() };
	mockOperationId.mockImplementation(() => `operation-${++operationNumber}`);
	mockGetReason.mockImplementation(
		(error: { reason?: string }) => error?.reason ?? null,
	);
	mockGetPost.mockResolvedValue({ post: discussion() });
	mockListReplies.mockResolvedValue({
		replies: [reply('reply-1'), reply('reply-2', 'owner')],
		replyCount: 2,
		nextCursor: null,
	});
	mockListSupport.mockResolvedValue({
		postId: 'post-1',
		supporters: [],
		supportCount: 0,
		viewerIsPraying: false,
		nextCursor: null,
	});
	mockCreateReply.mockResolvedValue({
		postId: 'post-1',
		replyId: 'new-reply',
		revision: 0,
		createdAt: timestamp,
	});
	mockEditReply.mockResolvedValue({
		replyId: 'reply-2',
		revision: 3,
		editedAt: timestamp,
	});
	mockDeleteReply.mockResolvedValue({
		replyId: 'reply-2',
		deletedAt: timestamp,
	});
	mockDeletePost.mockResolvedValue({
		postId: 'post-1',
		deletedAt: timestamp,
	});
	mockSetSupport.mockResolvedValue({
		postId: 'post-1',
		isPraying: true,
		revision: 1,
		updatedAt: timestamp,
	});
	mockSetStatus.mockResolvedValue({
		postId: 'post-1',
		prayerRequestStatus: 'Answered',
		revision: 4,
	});
});
afterEach(() => {
	if (renderer) act(() => renderer.unmount());
});

it('loads the full post and chronological reply page with a cold-open return path', async () => {
	await mount();
	expect(renderedText()).toContain('Welcome to the conversation.');
	expect(
		renderer.root.find(
			(node) =>
				String(node.type) === 'Text' &&
				Array.isArray(node.props['children']) &&
				node.props['children'].join('') === 'Replies (2)',
		),
	).toBeTruthy();
	expect(
		renderer.root.findAllByProps({ testID: 'community-reply-reply-1' }),
	).toHaveLength(1);
	expect(
		renderer.root.findAllByProps({ testID: 'community-reply-reply-2' }),
	).toHaveLength(1);
	pressButton('Return to Grace Church');
	expect(mockReplace).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]',
		params: { communityId: 'group' },
	});
});

it('loads another chronological reply page without duplicating records', async () => {
	mockListReplies
		.mockResolvedValueOnce({
			replies: [reply('reply-1')],
			replyCount: 2,
			nextCursor: 'cursor-1',
		})
		.mockResolvedValueOnce({
			replies: [reply('reply-1'), reply('reply-2')],
			replyCount: 2,
			nextCursor: null,
		});
	await mount();
	await act(async () => pressButton('Load more replies'));
	expect(
		renderer.root.findAllByProps({ testID: 'community-reply-reply-1' }),
	).toHaveLength(1);
	expect(
		renderer.root.findAllByProps({ testID: 'community-reply-reply-2' }),
	).toHaveLength(1);
	expect(mockListReplies.mock.calls[1][0]).toEqual({
		communityId: 'group',
		postId: 'post-1',
		cursor: 'cursor-1',
	});
});

it('retains an uncertain reply and retries the same idempotent request', async () => {
	mockCreateReply.mockRejectedValueOnce(new Error('network'));
	await mount();
	act(() =>
		field('community-reply-text').props['onChange'](
			'Please know I am praying.',
		),
	);
	await act(async () => field('submit-community-reply').props['onPress']());
	expect(renderedText()).toContain(
		'couldn’t confirm whether your reply was added',
	);
	expect(field('community-reply-text').props['readOnly']).toBe(true);
	await act(async () => field('submit-community-reply').props['onPress']());
	expect(mockCreateReply.mock.calls[1]).toEqual(
		mockCreateReply.mock.calls[0],
	);
	expect(mockOperationId).toHaveBeenCalledTimes(1);
});

it('shows only author controls and preserves a local reply edit on conflict', async () => {
	mockEditReply.mockRejectedValue({ reason: 'RevisionConflict' });
	await mount();
	expect(renderedText()).toContain('Edit post');
	expect(
		renderer.root.findAll(
			(node) =>
				String(node.type) === 'Button' &&
				node.props['children'] === 'Edit',
		),
	).toHaveLength(1);
	pressButton('Edit');
	act(() =>
		field('edit-reply-reply-2').props['onChange']('My changed reply'),
	);
	await act(async () => field('save-reply-reply-2').props['onPress']());
	expect(field('edit-reply-reply-2').props['value']).toBe('My changed reply');
	expect(renderedText()).toContain('changed since you opened it');
});

it('confirms post and reply deletion using their current revisions', async () => {
	await mount();
	pressButton('Delete post');
	await act(async () => mockAlert.mock.calls[0][2][1].onPress());
	expect(mockDeletePost).toHaveBeenCalledWith(
		expect.objectContaining({ expectedRevision: 3 }),
	);
	pressButton('Delete');
	await act(async () => mockAlert.mock.calls[1][2][1].onPress());
	expect(mockDeleteReply).toHaveBeenCalledWith(
		expect.objectContaining({ replyId: 'reply-2', expectedRevision: 2 }),
	);
});

it('shows real prayer support, toggles desired state, and updates author status without text', async () => {
	mockGetPost.mockResolvedValue({ post: prayer() });
	mockListSupport.mockResolvedValue({
		postId: 'post-1',
		supporters: [
			{
				userId: 'member',
				displayName: 'Jordan',
				acknowledgedAt: timestamp,
			},
		],
		supportCount: 1,
		viewerIsPraying: false,
		nextCursor: null,
	});
	await mount();
	expect(renderedText()).toContain('1 person has');
	expect(renderedText()).toContain(
		'does not mark your daily Pray practice complete',
	);
	await act(async () => field('toggle-prayer-support').props['onPress']());
	expect(mockSetSupport).toHaveBeenCalledWith(
		expect.objectContaining({ isPraying: true }),
	);
	await act(async () => field('prayer-status-Answered').props['onPress']());
	expect(mockSetStatus).toHaveBeenCalledWith(
		expect.objectContaining({
			prayerRequestStatus: 'Answered',
			expectedRevision: 3,
		}),
	);
	expect(mockSetStatus.mock.calls[0][0]).not.toHaveProperty('text');
});

it('removes mutation controls after lost membership and closes new replies in an archive', async () => {
	await mount();
	mockContextState = { status: 'Unavailable' };
	act(() => renderer.update(createElement(CommunityPostScreen)));
	expect(renderedText()).toContain('This conversation is unavailable');
	expect(renderedText()).not.toContain('Add a reply');

	act(() => renderer.unmount());
	mockContextState = {
		status: 'Ready',
		context: context({ status: 'Closed' }),
	};
	await mount();
	expect(renderedText()).toContain('read-only archive');
	expect(renderedText()).not.toContain('Edit post');
	expect(renderedText()).toContain('Delete post');
});

it('keeps replies visible beneath a parent tombstone and disables new replies', async () => {
	mockGetPost.mockResolvedValue({
		post: discussion('owner', {
			status: 'AuthorDeleted',
			postType: 'Discussion',
			deletedAt: timestamp,
		}),
	});
	await mount();
	expect(renderedText()).toContain('Post deleted by its author');
	expect(renderedText()).toContain('Reply reply-1');
	expect(renderedText()).toContain('no longer accepts new replies');
	expect(
		renderer.root.findAllByProps({ testID: 'community-reply-text' }),
	).toHaveLength(0);
});
