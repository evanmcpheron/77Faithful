import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CommunityNotificationsScreen } from './community-notifications.screen';

const push = jest.fn();
const open = jest.fn();
const mark = jest.fn();
const refresh = jest.fn();
let accountId = 'first';
let focused = true;
let inboxState: unknown;
const event = {
	eventId: 'event',
	communityId: 'group',
	postId: 'post',
	replyId: null,
	actorUserId: 'actor',
	category: 'Announcement',
	createdAt: { seconds: 100, nanoseconds: 0 },
	readAt: null,
};
jest.mock('expo-router', () => ({ useRouter: () => ({ push }) }));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({ account: { userId: accountId } }),
}));
jest.mock('@td/providers/header-scroll/use-screen-scroll-offset.hook', () => ({
	useScreenScrollOffset: () => ({
		scrollOffset: { value: 0 },
		handleScrollPositionChange: jest.fn(),
	}),
}));
jest.mock('../use-community-notifications.hook', () => ({
	useCommunityNotifications: () => ({
		state: inboxState,
		refresh,
		loadMore: jest.fn(),
		isCurrent: () => focused,
	}),
}));
jest.mock('../community-notification.service', () => ({
	openCommunityNotification: (...args: unknown[]) => open(...args),
	markCommunityNotificationRead: (...args: unknown[]) => mark(...args),
	createCommunityNotificationOperationId: () => 'operation',
	getCommunityNotificationReason: () => null,
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
		ListHeaderComponent?: unknown;
		ListFooterComponent?: unknown;
		data?: unknown[];
		renderItem?: (input: { item: unknown }) => unknown;
	}) => {
		const React = jest.requireActual('react') as typeof import('react');
		return React.createElement(
			'Screen',
			props,
			ListHeaderComponent as React.ReactNode,
			...(data ?? []).map(
				(item) => renderItem?.({ item }) as React.ReactNode,
			),
			ListFooterComponent as React.ReactNode,
		);
	},
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'Card' }));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'Button',
}));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const ready = {
	status: 'Ready',
	items: [event],
	nextCursor: null,
	unreadCount: 1,
	refreshing: false,
	refreshError: false,
	loadingMore: false,
	loadMoreError: false,
};
let tree: ReactTestRenderer;
beforeEach(() => {
	jest.clearAllMocks();
	accountId = 'first';
	focused = true;
	inboxState = ready;
	mark.mockResolvedValue(undefined);
});
const render = async () => {
	await act(async () => {
		tree = create(createElement(CommunityNotificationsScreen));
	});
	return tree!;
};
const text = (tree: ReactTestRenderer) =>
	tree.root
		.findAll((node) => String(node.type) === 'Text')
		.map((node) => node.children.join(''))
		.join(' ');

it('shows actual unread events and opens the trusted group-scoped post route', async () => {
	open.mockResolvedValue({
		status: 'Available',
		communityId: 'authorizedGroup',
		postId: 'authorizedPost',
		replyId: null,
	});
	const screen = await render();
	expect(text(screen)).toContain('1 unread');
	expect(text(screen)).toContain('Community announcement · Unread');
	await act(async () => {
		await screen.root
			.findByProps({ testID: 'open-notification-event' })
			.props['onPress']();
	});
	expect(open).toHaveBeenCalledWith('event');
	expect(push).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]/posts/[postId]',
		params: { communityId: 'authorizedGroup', postId: 'authorizedPost' },
	});
});
it('shows unavailable behavior for a deleted, blocked, or lost-membership target', async () => {
	open.mockResolvedValue({
		status: 'Unavailable',
		communityId: null,
		postId: null,
		replyId: null,
	});
	const screen = await render();
	await act(async () => {
		await screen.root
			.findByProps({ testID: 'open-notification-event' })
			.props['onPress']();
	});
	expect(push).not.toHaveBeenCalled();
	expect(text(screen)).toContain('no longer available to you');
});
it('retains unread event and retry message when mark-read fails', async () => {
	mark.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(
		undefined,
	);
	const screen = await render();
	await act(async () => {
		await screen.root
			.findAll((node) => String(node.type) === 'Button')
			.find((node) => node.children.join('') === 'Mark read')
			?.props['onPress']();
	});
	expect(text(screen)).toContain('It remains in your inbox');
	expect(
		screen.root.findByProps({ testID: 'notification-event' }),
	).toBeDefined();
	await act(async () => {
		await screen.root
			.findAll((node) => String(node.type) === 'Button')
			.find((node) => node.children.join('') === 'Mark read')
			?.props['onPress']();
	});
	expect(mark).toHaveBeenNthCalledWith(1, {
		eventId: 'event',
		operationId: 'operation',
	});
	expect(mark).toHaveBeenNthCalledWith(2, {
		eventId: 'event',
		operationId: 'operation',
	});
});
it('remounts the inbox for another account without showing old account events', async () => {
	const screen = await render();
	accountId = 'second';
	inboxState = { ...ready, items: [], unreadCount: 0 };
	await act(async () => {
		screen.update(createElement(CommunityNotificationsScreen));
	});
	expect(text(screen)).toContain('No notifications yet.');
	expect(
		screen.root.findAllByProps({ testID: 'notification-event' }),
	).toHaveLength(0);
});
