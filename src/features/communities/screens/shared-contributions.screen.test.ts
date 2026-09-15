import { createElement, type ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { SharedContributionsScreen } from './shared-contributions.screen';

const mockList = jest.fn();
const mockDeletePost = jest.fn();
const mockDeleteReply = jest.fn();
const mockReason = jest.fn();
const mockAlert = jest.fn();
let currentUserId: string | null = 'owner';
let renderer: ReactTestRenderer;

jest.mock('expo-router', () => ({
	useFocusEffect: (effect: () => void | (() => void)) => {
		const React = jest.requireActual('react') as typeof import('react');
		React.useEffect(effect, [effect]);
	},
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({
		account: currentUserId ? { userId: currentUserId } : null,
	}),
}));
jest.mock('@td/providers/header-scroll/use-screen-scroll-offset.hook', () => ({
	useScreenScrollOffset: () => ({
		scrollOffset: { value: 0 },
		handleScrollPositionChange: jest.fn(),
	}),
}));
jest.mock('../community-post.service', () => ({
	listOwnCommunityContributions: (...args: unknown[]) => mockList(...args),
	deleteCommunityPost: (...args: unknown[]) => mockDeletePost(...args),
	deleteCommunityReply: (...args: unknown[]) => mockDeleteReply(...args),
	getCommunityPostReason: (...args: unknown[]) => mockReason(...args),
	createCommunityPostOperationId: () => 'operation-1',
}));
jest.mock('react-native', () => ({
	View: 'View',
	Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownListScreen: ({
		data,
		renderItem,
		ListHeaderComponent,
		ListFooterComponent,
		...props
	}: {
		data: unknown[];
		renderItem: (args: { item: unknown }) => ReactNode;
		ListHeaderComponent: ReactNode;
		ListFooterComponent: ReactNode;
	}) =>
		createElement(
			'List',
			props,
			ListHeaderComponent,
			...data.map((item) => renderItem({ item })),
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

const ownPost = {
	communityId: 'left-group',
	postId: 'post-1',
	kind: 'Post',
	publicationStatus: 'Published',
	revision: 2,
	createdAt: { seconds: 10, nanoseconds: 0 },
	text: 'My shared copy.',
};
const ownReply = {
	communityId: 'removed-group',
	postId: 'post-2',
	replyId: 'reply-1',
	kind: 'Reply',
	publicationStatus: 'Published',
	revision: 1,
	createdAt: { seconds: 9, nanoseconds: 0 },
	text: 'My reply.',
};
const page = (contributions: unknown[], nextCursor: string | null = null) => ({
	contributions,
	nextCursor,
});
const shown = () => JSON.stringify(renderer.toJSON());
const press = async (label: string) => {
	await act(async () => {
		renderer.root
			.find(
				(node) =>
					String(node.type) === 'Button' &&
					(Array.isArray(node.props['children'])
						? node.props['children'].join('')
						: node.props['children']) === label,
			)
			.props['onPress']();
	});
};
const confirm = async () => {
	await act(async () => {
		mockAlert.mock.calls.at(-1)?.[2]?.[1]?.onPress();
	});
};

beforeEach(() => {
	jest.clearAllMocks();
	currentUserId = 'owner';
	mockReason.mockReturnValue(null);
	mockList.mockResolvedValue(page([]));
	mockDeletePost.mockResolvedValue({ postId: 'post-1' });
	mockDeleteReply.mockResolvedValue({ replyId: 'reply-1' });
});

it('shows owner contributions after leaving and removal, and deletes an own reply', async () => {
	mockList.mockResolvedValue(page([ownPost, ownReply]));
	await act(async () => {
		renderer = create(createElement(SharedContributionsScreen));
	});
	expect(shown()).toContain('My shared copy.');
	expect(shown()).toContain('My reply.');
	expect(shown()).not.toContain('Another member');
	await press('Delete shared reply');
	expect(mockAlert.mock.calls.at(-1)?.[1]).toContain(
		'original private reflection',
	);
	await confirm();
	expect(mockDeleteReply).toHaveBeenCalledWith(
		expect.objectContaining({
			communityId: 'removed-group',
			replyId: 'reply-1',
			expectedRevision: 1,
		}),
	);
	expect(shown()).not.toContain('My reply.');
	expect(shown()).toContain('Deleted');
	await act(async () => {
		renderer.root
			.findByProps({ testID: 'shared-contributions-screen' })
			.props['onRefresh']();
	});
	expect(shown()).not.toContain('My reply.');
});

it('keeps text and retries the same deletion request after an uncertain failure', async () => {
	mockList.mockResolvedValue(page([ownPost]));
	mockDeletePost.mockRejectedValueOnce(new Error('network'));
	await act(async () => {
		renderer = create(createElement(SharedContributionsScreen));
	});
	await press('Delete shared post');
	await confirm();
	expect(shown()).toContain('My shared copy.');
	expect(shown()).toContain('couldn’t confirm');
	await press('Delete shared post');
	await confirm();
	expect(mockDeletePost).toHaveBeenCalledTimes(2);
	expect(mockDeletePost.mock.calls[0]?.[0]).toEqual(
		mockDeletePost.mock.calls[1]?.[0],
	);
	expect(shown()).not.toContain('My shared copy.');
});

it('clears another account’s rows and rejects stale account results', async () => {
	let finishOld: (value: unknown) => void = () => {};
	mockList
		.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finishOld = resolve;
				}),
		)
		.mockResolvedValue(page([]));
	await act(async () => {
		renderer = create(createElement(SharedContributionsScreen));
	});
	currentUserId = 'next-owner';
	await act(async () => {
		renderer.update(createElement(SharedContributionsScreen));
	});
	await act(async () => {
		finishOld(page([ownPost]));
	});
	expect(shown()).not.toContain('My shared copy.');
	expect(shown()).toContain('no shared contributions');
});

it('does not replace current rows with an older refresh response', async () => {
	let finishRefresh: (value: unknown) => void = () => {};
	mockList
		.mockResolvedValueOnce(page([ownPost]))
		.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finishRefresh = resolve;
				}),
		)
		.mockResolvedValue(page([ownReply]));
	await act(async () => {
		renderer = create(createElement(SharedContributionsScreen));
	});
	await act(async () => {
		renderer.root
			.findByProps({ testID: 'shared-contributions-screen' })
			.props['onRefresh']();
	});
	// Focus loss invalidates the refresh; the next account render starts a new owner request.
	currentUserId = 'next-owner';
	await act(async () => {
		renderer.update(createElement(SharedContributionsScreen));
	});
	await act(async () => {
		finishRefresh(page([ownPost]));
	});
	expect(shown()).toContain('My reply.');
	expect(shown()).not.toContain('My shared copy.');
});

it('clears rows when an author-only deletion is denied', async () => {
	mockList.mockResolvedValue(page([ownPost]));
	mockDeletePost.mockRejectedValue({
		details: { reason: 'PostAuthorRequired' },
	});
	mockReason.mockReturnValue('PostAuthorRequired');
	await act(async () => {
		renderer = create(createElement(SharedContributionsScreen));
	});
	await press('Delete shared post');
	await confirm();
	expect(shown()).not.toContain('My shared copy.');
	expect(shown()).toContain('unavailable');
});
