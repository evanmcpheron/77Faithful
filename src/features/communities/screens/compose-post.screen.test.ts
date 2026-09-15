import type { ICommunityPost } from '@td/types/community/community-post.types';
import type { ICommunityContext } from '@td/types/community/community.types';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ComposePostScreen } from './compose-post.screen';

const mockCreatePost = jest.fn();
const mockEditPost = jest.fn();
const mockGetPost = jest.fn();
const mockGetReason = jest.fn();
const mockOperationId = jest.fn();
const mockReplace = jest.fn();
const mockDispatch = jest.fn();
const mockAddListener = jest.fn();
const mockAlert = jest.fn();
const mockRetryContext = jest.fn();
let mockUserId = 'owner-1';
let mockPostId: string | undefined;
let mockContextState: { status: string; context?: ICommunityContext };

const context = ({
	role = 'Organizer',
	status = 'Active',
	canCreatePost = true,
}: {
	role?: 'Organizer' | 'Member';
	status?: 'Active' | 'Closed';
	canCreatePost?: boolean;
} = {}): ICommunityContext => ({
	community: {
		communityId: 'group',
		name: 'Grace Church',
		purpose: '',
		organizer: { userId: 'owner-1', displayName: 'Anna' },
		status,
	},
	communityRevision: 1,
	membership: {
		communityId: 'group',
		userId: mockUserId,
		displayName: 'Anna',
		role,
		status: 'Active',
	},
	capabilities: {
		canReadMembers: true,
		canCreatePost,
		canInviteMembers: role === 'Organizer',
		canManageMembers: role === 'Organizer',
		canEditCommunity: role === 'Organizer',
		canCloseCommunity: role === 'Organizer',
		canLeaveCommunity: true,
	},
	activeMemberCount: { value: 2, isExact: true },
});

const publishedPost = (
	postType: 'Discussion' | 'OrganizerAnnouncement' = 'Discussion',
): ICommunityPost => ({
	schemaVersion: 1,
	communityId: 'group',
	postId: 'post-1',
	author: { userId: mockUserId, displayName: 'Anna' },
	revision: 4,
	createdAt: { seconds: 1, nanoseconds: 0 },
	updatedAt: { seconds: 2, nanoseconds: 0 },
	editedAt: null,
	publication: {
		status: 'Published',
		content: { postType, text: 'Original text' },
	},
});

jest.mock('expo-router', () => {
	const React = jest.requireActual('react') as typeof import('react');
	return {
		useLocalSearchParams: () => ({
			communityId: 'group',
			...(mockPostId ? { postId: mockPostId } : {}),
		}),
		useRouter: () => ({ replace: mockReplace }),
		useNavigation: () => ({
			addListener: mockAddListener,
			dispatch: mockDispatch,
		}),
		useFocusEffect: (effect: () => void | (() => void)) =>
			React.useEffect(effect, [effect]),
	};
});
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({ account: mockUserId ? { userId: mockUserId } : null }),
}));
jest.mock('@td/providers/header-scroll/use-screen-scroll-offset.hook', () => ({
	useScreenScrollOffset: () => ({
		scrollOffset: { value: 0 },
		handleScrollPositionChange: jest.fn(),
	}),
}));
jest.mock('../use-community-context.hook', () => ({
	useCommunityContext: () => ({
		state: mockContextState,
		retry: mockRetryContext,
	}),
}));
jest.mock('../community-post.service', () => ({
	createCommunityPost: (...args: unknown[]) => mockCreatePost(...args),
	editCommunityPost: (...args: unknown[]) => mockEditPost(...args),
	getCommunityPost: (...args: unknown[]) => mockGetPost(...args),
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
	TurndownScrollScreen: 'Screen',
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
let accountNumber = 0;

const mount = async () => {
	await act(async () => {
		renderer = create(createElement(ComposePostScreen));
	});
};
const field = () =>
	renderer.root.findByProps({ testID: 'community-post-text' });
const choose = (postType: string) =>
	act(() =>
		renderer.root
			.findByProps({ testID: `post-type-${postType}` })
			.props['onPress'](),
	);
const submit = () =>
	act(() =>
		renderer.root
			.findByProps({ testID: 'submit-community-post' })
			.props['onPress'](),
	);
const renderText = () => JSON.stringify(renderer.toJSON());

beforeEach(() => {
	jest.clearAllMocks();
	accountNumber += 1;
	mockUserId = `owner-${accountNumber}`;
	mockPostId = undefined;
	mockContextState = { status: 'Ready', context: context() };
	mockOperationId.mockReturnValue('operation-1');
	mockCreatePost.mockResolvedValue({
		communityId: 'group',
		postId: 'created',
		revision: 0,
		createdAt: { seconds: 1, nanoseconds: 0 },
	});
	mockEditPost.mockResolvedValue({
		postId: 'post-1',
		revision: 5,
		editedAt: { seconds: 2, nanoseconds: 0 },
	});
	mockGetPost.mockResolvedValue({ post: publishedPost() });
	mockGetReason.mockImplementation((error: { reason?: string }) =>
		error?.reason ? error.reason : null,
	);
	mockAddListener.mockReturnValue(jest.fn());
});
afterEach(() => {
	if (renderer) act(() => renderer.unmount());
});

it('shows the named later-member audience and all organizer create types', async () => {
	await mount();
	expect(renderText()).toContain('Grace Church');
	expect(renderText()).toContain(
		'Current and future members can read this post',
	);
	expect(
		renderer.root.findAll(
			(node) =>
				String(node.type) === 'Pressable' &&
				String(node.props['testID']).startsWith('post-type-'),
		),
	).toHaveLength(4);
	expect(renderText()).toContain(
		'does not change any daily-practice completion',
	);
});

it.each([
	['PrayerRequest', 'Share prayer request'],
	['Discussion', 'Post discussion'],
	['SharedReflectionCopy', 'Share reflection'],
	['OrganizerAnnouncement', 'Post announcement'],
])('creates %s with the canonical content shape', async (postType, label) => {
	await mount();
	choose(postType);
	act(() => field().props['onChange']('  Shared words  '));
	expect(
		renderer.root.findByProps({ testID: 'submit-community-post' }).props[
			'children'
		],
	).toBe(label);
	await act(async () => submit());
	const content = mockCreatePost.mock.calls[0][0].content;
	expect(content).toEqual(
		postType === 'PrayerRequest'
			? {
					postType,
					text: '  Shared words  ',
					prayerRequestStatus: 'Current',
				}
			: { postType, text: '  Shared words  ' },
	);
	expect(mockReplace).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]',
		params: { communityId: 'group', postSaved: 'created' },
	});
});

it('denies the announcement mode to a member', async () => {
	mockContextState = {
		status: 'Ready',
		context: context({ role: 'Member' }),
	};
	await mount();
	expect(
		renderer.root.findAllByProps({
			testID: 'post-type-OrganizerAnnouncement',
		}),
	).toHaveLength(0);
});

it('reports blank and over-limit text without calling the backend', async () => {
	await mount();
	await act(async () => submit());
	expect(field().props['errorMessage']).toBe(
		'Write something before sharing it.',
	);
	act(() => field().props['onChange']('x'.repeat(10_001)));
	await act(async () => submit());
	expect(field().props['errorMessage']).toBe(
		'Use 10,000 characters or fewer.',
	);
	expect(mockCreatePost).not.toHaveBeenCalled();
});

it('ignores a double tap while publication is pending', async () => {
	let resolve: (value: unknown) => void = () => undefined;
	mockCreatePost.mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	await mount();
	act(() => field().props['onChange']('Please pray.'));
	act(() => {
		submit();
		submit();
	});
	expect(mockCreatePost).toHaveBeenCalledTimes(1);
	await act(async () =>
		resolve({ communityId: 'group', postId: 'created', revision: 0 }),
	);
});

it('retries an uncertain save with the same locked request and operation ID', async () => {
	mockCreatePost.mockRejectedValueOnce(new Error('Network unavailable'));
	await mount();
	act(() => field().props['onChange']('Please pray.'));
	await act(async () => submit());
	expect(renderText()).toContain(
		'couldn’t confirm whether this post was saved',
	);
	expect(field().props['readOnly']).toBe(true);
	await act(async () => submit());
	expect(mockCreatePost.mock.calls[1]).toEqual(mockCreatePost.mock.calls[0]);
	expect(mockOperationId).toHaveBeenCalledTimes(1);
});

it('loads edit text and keeps type and audience immutable', async () => {
	mockPostId = 'post-1';
	mockGetPost.mockResolvedValue({ post: publishedPost('Discussion') });
	await mount();
	expect(field().props['value']).toBe('Original text');
	expect(
		renderer.root.findByProps({ testID: 'immutable-post-type' }),
	).toBeTruthy();
	expect(
		renderer.root.findAll((node) => String(node.type) === 'Pressable'),
	).toHaveLength(0);
	act(() => field().props['onChange']('Edited text'));
	await act(async () => submit());
	expect(mockEditPost).toHaveBeenCalledWith({
		communityId: 'group',
		postId: 'post-1',
		text: 'Edited text',
		expectedRevision: 4,
		operationId: 'operation-1',
	});
});

it('preserves edited text when the backend reports a revision conflict', async () => {
	mockPostId = 'post-1';
	mockEditPost.mockRejectedValue({ reason: 'RevisionConflict' });
	await mount();
	act(() => field().props['onChange']('My recoverable edit'));
	await act(async () => submit());
	expect(field().props['value']).toBe('My recoverable edit');
	expect(renderText()).toContain('changed since you opened it');
});

it('confirms discard on back and removes the memory draft', async () => {
	await mount();
	act(() => field().props['onChange']('Unsaved words'));
	const listener = mockAddListener.mock.calls.at(-1)?.[1];
	const event = {
		preventDefault: jest.fn(),
		data: { action: { type: 'GO_BACK' } },
	};
	act(() => listener(event));
	expect(event.preventDefault).toHaveBeenCalled();
	expect(mockAlert).toHaveBeenCalledWith(
		'Discard this post?',
		expect.any(String),
		expect.any(Array),
	);
	const buttons = mockAlert.mock.calls[0][2];
	act(() => buttons[1].onPress());
	expect(mockDispatch).toHaveBeenCalledWith(event.data.action);

	act(() => renderer.unmount());
	await mount();
	expect(field().props['value']).toBe('');
});

it('does not navigate from a stale submit after the account changes', async () => {
	let resolve: (value: unknown) => void = () => undefined;
	mockCreatePost.mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	await mount();
	act(() => field().props['onChange']('First account text'));
	submit();
	mockUserId = 'other-account';
	act(() => renderer.update(createElement(ComposePostScreen)));
	await act(async () => resolve({ postId: 'created' }));
	expect(mockReplace).not.toHaveBeenCalled();
	expect(field().props['value']).toBe('');
});

it.each([
	[
		{
			status: 'Ready',
			context: context({ status: 'Closed', canCreatePost: false }),
		},
		'read-only archive',
	],
	[
		{ status: 'Unavailable' },
		'membership, permission, or the post may have changed',
	],
])(
	'keeps closed and access-loss states non-publishing',
	async (state, copy) => {
		mockContextState = state;
		await mount();
		expect(renderText()).toContain(copy);
		expect(mockCreatePost).not.toHaveBeenCalled();
	},
);
