import type { ICommunityContext } from '@td/types/community/community.types';
import { createElement } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { TCommunityMembersState } from '../use-community-members.hook';
import {
	CommunityMembersContent,
	CommunityMembersView,
} from './community-members.screen';

const mockAlert = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockContextRetry = jest.fn();
const mockMembersRefresh = jest.fn();
const mockLoadMore = jest.fn();
const mockLeave = jest.fn();
const mockRemove = jest.fn();
const mockTransfer = jest.fn();
const mockReason = jest.fn();
let mockContextState: { status: string; context?: ICommunityContext };
let mockMembersState: Record<string, unknown>;

jest.mock('expo-router', () => ({
	useLocalSearchParams: () => ({ communityId: 'group' }),
	useRouter: () => ({ push: mockPush, replace: mockReplace }),
	useFocusEffect: (effect: () => void | (() => void)) => {
		const React = jest.requireActual('react') as typeof import('react');
		React.useEffect(effect, [effect]);
	},
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('react-native', () => ({
	Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
	View: 'View',
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
		state: mockContextState,
		retry: mockContextRetry,
	}),
}));
jest.mock('../use-community-members.hook', () => ({
	useCommunityMembers: () => ({
		state: mockMembersState,
		refresh: mockMembersRefresh,
		loadMore: mockLoadMore,
	}),
}));
jest.mock('../community-administration.service', () => ({
	createCommunityAdministrationOperationId: () => 'operation-id',
	getCommunityAdministrationReason: (...args: unknown[]) =>
		mockReason(...args),
	leaveCommunity: (...args: unknown[]) => mockLeave(...args),
	removeCommunityMember: (...args: unknown[]) => mockRemove(...args),
	transferCommunityOrganizer: (...args: unknown[]) => mockTransfer(...args),
}));
jest.mock('../community-safety.service', () => ({
	createCommunitySafetyOperationId: () => 'safety-operation-id',
	getCommunitySafetyReason: () => null,
	blockCommunityMember: jest.fn(),
}));
jest.mock('@td/components/layout/screen/screen.component', () => {
	const { createElement: element } = jest.requireActual('react');
	return {
		TurndownListScreen: (props: Record<string, unknown>) => {
			const data = props['data'] as unknown[];
			const renderItem = props['renderItem'] as (args: {
				item: unknown;
			}) => React.ReactNode;
			return element(
				'List',
				{ testID: props['testID'] },
				props['ListHeaderComponent'] as React.ReactNode,
				...data.map((item) => renderItem({ item })),
				props['ListFooterComponent'] as React.ReactNode,
			);
		},
	};
});
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'Button',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'Card' }));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const context = (
	role: 'Organizer' | 'Member',
	status: 'Active' | 'Closed' = 'Active',
): ICommunityContext => ({
	community: {
		communityId: 'group',
		name: 'Grace Church',
		purpose: '',
		organizer: { userId: 'owner', displayName: 'Anna' },
		status,
	},
	communityRevision: 7,
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
	activeMemberCount: { value: 2, isExact: true },
});
const members = [
	{
		communityId: 'group',
		userId: 'owner',
		displayName: 'Anna',
		role: 'Organizer' as const,
	},
	{
		communityId: 'group',
		userId: 'member',
		displayName: 'Maria',
		role: 'Member' as const,
	},
];
const readyMembers: Extract<TCommunityMembersState, { status: 'Ready' }> = {
	status: 'Ready' as const,
	members,
	nextCursor: null,
	isLoadingMore: false,
	loadMoreError: false,
};
const viewActions = {
	onRetry: jest.fn(),
	onLoadMore: jest.fn(),
	onReturn: jest.fn(),
	onInvite: jest.fn(),
	onSettings: jest.fn(),
	onLeave: jest.fn(),
	onRemove: jest.fn(),
	onTransfer: jest.fn(),
	onReport: jest.fn(),
	onBlock: jest.fn(),
	onScrollPositionChange: jest.fn(),
};
let renderer: ReactTestRenderer;
const scrollOffset = { value: 0 } as SharedValue<number>;
const mountView = (
	currentContext: ICommunityContext,
	memberState = readyMembers,
) => {
	act(() => {
		renderer = create(
			createElement(CommunityMembersView, {
				contextState: { status: 'Ready', context: currentContext },
				membersState: memberState,
				currentUserId: currentContext.membership.userId,
				headerHeight: 80,
				actionKey: null,
				actionMessage: null,
				scrollOffset,
				...viewActions,
			}),
		);
	});
};
const text = () => JSON.stringify(renderer.toJSON());
const buttons = (label: string) =>
	renderer.root.findAll(
		(node) =>
			String(node.type) === 'Button' && node.props['children'] === label,
	);

beforeEach(() => {
	jest.clearAllMocks();
	mockContextState = { status: 'Ready', context: context('Organizer') };
	mockMembersState = readyMembers;
	mockLeave.mockResolvedValue({});
	mockRemove.mockResolvedValue({});
	mockTransfer.mockResolvedValue({});
	mockReason.mockReturnValue(null);
});
afterEach(() => act(() => renderer.unmount()));

it('renders safe role fields, includes the current user, and exposes pagination', () => {
	mountView(context('Organizer'), { ...readyMembers, nextCursor: 'next' });
	expect(text()).toContain('Anna');
	expect(text()).toContain('(You)');
	expect(text()).toContain('Organizer');
	expect(text()).toContain('Maria');
	expect(text()).toContain('Member');
	expect(text()).not.toContain('email');
	expect(buttons('Invite people')).toHaveLength(1);
	act(() => buttons('Invite people')[0]?.props['onPress']());
	expect(viewActions.onInvite).toHaveBeenCalledTimes(1);
	expect(buttons('Load more members')).toHaveLength(1);
	act(() => buttons('Load more members')[0]?.props['onPress']());
	expect(viewActions.onLoadMore).toHaveBeenCalledTimes(1);
});

it('requires explicit removal and transfer confirmation and supports cancellation', () => {
	mountView(context('Organizer'));
	act(() => buttons('Remove member')[0]?.props['onPress']());
	expect(mockAlert.mock.calls[0]?.[1]).toContain(
		'does not erase their private journey',
	);
	expect(viewActions.onRemove).not.toHaveBeenCalled();
	act(() => mockAlert.mock.calls[0]?.[2]?.[0]?.onPress?.());
	expect(viewActions.onRemove).not.toHaveBeenCalled();
	act(() => mockAlert.mock.calls[0]?.[2]?.[1]?.onPress());
	expect(viewActions.onRemove).toHaveBeenCalledWith(members[1]);

	act(() => buttons('Transfer ownership')[0]?.props['onPress']());
	expect(mockAlert.mock.calls[1]?.[1]).toContain(
		'does not give access to anyone’s private journal',
	);
	act(() => mockAlert.mock.calls[1]?.[2]?.[1]?.onPress());
	expect(viewActions.onTransfer).toHaveBeenCalledWith(members[1]);
});

it('reports organizer members and requires block confirmation without changing membership', () => {
	mountView(context('Member'));
	act(() => buttons('Report member')[0]?.props['onPress']());
	expect(viewActions.onReport).toHaveBeenCalledWith(members[0]);
	act(() => buttons('Block member')[0]?.props['onPress']());
	expect(mockAlert.mock.calls[0]?.[1]).toContain(
		'does not remove either of you',
	);
	act(() => mockAlert.mock.calls[0]?.[2]?.[0]?.onPress?.());
	expect(viewActions.onBlock).not.toHaveBeenCalled();
	act(() => mockAlert.mock.calls[0]?.[2]?.[1]?.onPress());
	expect(viewActions.onBlock).toHaveBeenCalledWith(members[0]);
});

it('lets an ordinary member confirm leaving and explains retained contributions', () => {
	mountView(context('Member'));
	expect(buttons('Remove member')).toHaveLength(0);
	expect(buttons('Transfer ownership')).toHaveLength(0);
	act(() => buttons('Leave community')[0]?.props['onPress']());
	expect(mockAlert.mock.calls[0]?.[1]).toContain(
		'will remain until you separately delete them',
	);
	act(() => mockAlert.mock.calls[0]?.[2]?.[1]?.onPress());
	expect(viewActions.onLeave).toHaveBeenCalledTimes(1);
});

it('keeps a closed archive readable while disabling organizer administration', () => {
	mountView(context('Organizer', 'Closed'));
	expect(text()).toContain('Read-only archive');
	expect(buttons('Invite people')).toHaveLength(0);
	expect(buttons('Remove member')).toHaveLength(0);
	expect(buttons('Transfer ownership')).toHaveLength(0);
	expect(buttons('Leave community')).toHaveLength(1);
});

it('handles loading, empty, recoverable error, and access loss', () => {
	act(() => {
		renderer = create(
			createElement(CommunityMembersView, {
				contextState: { status: 'Loading' },
				membersState: { status: 'Idle' },
				currentUserId: 'owner',
				headerHeight: 80,
				actionKey: null,
				actionMessage: null,
				scrollOffset,
				...viewActions,
			}),
		);
	});
	expect(text()).toContain('Loading community members');
	act(() =>
		renderer.update(
			createElement(CommunityMembersView, {
				contextState: { status: 'Ready', context: context('Member') },
				membersState: { ...readyMembers, members: [] },
				currentUserId: 'member',
				headerHeight: 80,
				actionKey: null,
				actionMessage: null,
				scrollOffset,
				...viewActions,
			}),
		),
	);
	expect(text()).toContain('No active members are available');
	act(() =>
		renderer.update(
			createElement(CommunityMembersView, {
				contextState: { status: 'Error' },
				membersState: { status: 'Error' },
				currentUserId: 'member',
				headerHeight: 80,
				actionKey: null,
				actionMessage: null,
				scrollOffset,
				...viewActions,
			}),
		),
	);
	expect(text()).toContain('Check your connection');
	act(() => buttons('Try again')[0]?.props['onPress']());
	expect(viewActions.onRetry).toHaveBeenCalledTimes(1);
	act(() =>
		renderer.update(
			createElement(CommunityMembersView, {
				contextState: { status: 'Unavailable' },
				membersState: { status: 'Unavailable' },
				currentUserId: 'member',
				headerHeight: 80,
				actionKey: null,
				actionMessage: null,
				scrollOffset,
				...viewActions,
			}),
		),
	);
	expect(text()).toContain('permission may have changed');
});

it('prevents duplicate transfer taps and refreshes a rejected stale role', async () => {
	let rejectTransfer!: (reason: unknown) => void;
	mockTransfer.mockReturnValue(
		new Promise((_, reject) => {
			rejectTransfer = reject;
		}),
	);
	act(() => {
		renderer = create(
			createElement(CommunityMembersContent, {
				userId: 'owner',
				communityId: 'group',
			}),
		);
	});
	act(() => buttons('Transfer ownership')[0]?.props['onPress']());
	const confirm = mockAlert.mock.calls[0]?.[2]?.[1]?.onPress;
	act(() => {
		confirm();
		confirm();
	});
	expect(mockTransfer).toHaveBeenCalledTimes(1);
	expect(mockTransfer).toHaveBeenCalledWith(
		expect.objectContaining({ expectedRevision: 7 }),
	);
	mockReason.mockReturnValue('OrganizerRequired');
	await act(async () =>
		rejectTransfer({ details: { reason: 'OrganizerRequired' } }),
	);
	expect(mockContextRetry).toHaveBeenCalledTimes(1);
	expect(mockMembersRefresh).toHaveBeenCalledTimes(1);
	expect(text()).toContain('permissions changed');
});

it('leaves once and replaces the route so community data is no longer mounted', async () => {
	mockContextState = { status: 'Ready', context: context('Member') };
	act(() => {
		renderer = create(
			createElement(CommunityMembersContent, {
				userId: 'member',
				communityId: 'group',
			}),
		);
	});
	act(() => buttons('Leave community')[0]?.props['onPress']());
	await act(async () => mockAlert.mock.calls[0]?.[2]?.[1]?.onPress());
	expect(mockLeave).toHaveBeenCalledTimes(1);
	expect(mockReplace).toHaveBeenCalledWith('/communities');
	expect(text()).toContain('Members are unavailable');
	expect(text()).not.toContain('Maria');
});
