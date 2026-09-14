import type { ICommunityContext } from '@td/types/community/community.types';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CommunityHome } from './community.screen';

jest.mock('expo-router', () => ({
	useLocalSearchParams: () => ({ communityId: 'group' }),
	useRouter: () => ({ replace: jest.fn() }),
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
		state: { status: 'Loading' },
		retry: jest.fn(),
	}),
}));
jest.mock('react-native', () => ({ View: 'View' }));
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

const communityContext = ({
	role,
	memberCount,
	status = 'Active',
	isExact = true,
}: {
	role: 'Organizer' | 'Member';
	memberCount: number;
	status?: 'Active' | 'Closed';
	isExact?: boolean;
}): ICommunityContext => ({
	community: {
		communityId: 'group',
		name: 'Grace Church',
		purpose: 'Pray together each week.',
		organizer: { userId: 'owner', displayName: 'Anna' },
		participationExpectations: 'Listen with care.',
		status,
	},
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
	activeMemberCount: { value: memberCount, isExact },
});

let renderer: ReactTestRenderer;
const mount = (state: React.ComponentProps<typeof CommunityHome>['state']) => {
	const onRetry = jest.fn();
	const onReturn = jest.fn();
	const onInvite = jest.fn();
	act(() => {
		renderer = create(
			createElement(CommunityHome, {
				state,
				onRetry,
				onReturn,
				onInvite,
			}),
		);
	});
	return { onRetry, onReturn, onInvite };
};
const renderedText = () => JSON.stringify(renderer.toJSON());
const press = (label: string) => {
	const button = renderer.root.find(
		(node) =>
			String(node.type) === 'Button' && node.props['children'] === label,
	);
	act(() => button.props['onPress']());
};
afterEach(() => act(() => renderer.unmount()));

it('renders organizer context with a working, prominent invitation action', () => {
	const actions = mount({
		status: 'Ready',
		context: communityContext({ role: 'Organizer', memberCount: 1 }),
	});
	expect(renderedText()).toContain('Your role: ","Organizer');
	expect(renderedText()).toContain('1 member');
	expect(renderedText()).toContain('Invite people when you’re ready');
	expect(
		renderer.root
			.findAll((node) => String(node.type) === 'Button')
			.map((node) => node.props['children']),
	).toEqual(['Invite people', 'Your communities']);
	press('Invite people');
	expect(actions.onInvite).toHaveBeenCalledWith('group');
});

it('renders member context, organizer identity, purpose, privacy, and bounded count', () => {
	mount({
		status: 'Ready',
		context: communityContext({
			role: 'Member',
			memberCount: 500,
			isExact: false,
		}),
	});
	expect(renderedText()).toContain('Grace Church');
	expect(renderedText()).toContain('Pray together each week.');
	expect(renderedText()).toContain('Organized by Anna');
	expect(renderedText()).toContain('Your role: ","Member');
	expect(renderedText()).toContain('500+ members');
	expect(renderedText()).toContain(
		'Membership does not share your private reflections',
	);
	expect(renderedText()).not.toContain('Invite people when you’re ready');
	expect(renderedText()).not.toContain('Invite people');
});

it('keeps the organizer invitation action available after others join', () => {
	const actions = mount({
		status: 'Ready',
		context: communityContext({ role: 'Organizer', memberCount: 4 }),
	});
	expect(renderedText()).not.toContain('You’re the only member');
	press('Invite people');
	expect(actions.onInvite).toHaveBeenCalledWith('group');
});

it('marks a closed community as a read-only archive without active actions', () => {
	mount({
		status: 'Ready',
		context: communityContext({
			role: 'Organizer',
			memberCount: 4,
			status: 'Closed',
		}),
	});
	expect(renderedText()).toContain('Read-only archive');
	expect(renderedText()).toContain('no new activity can be added');
	expect(renderedText()).not.toContain('Invite people when you’re ready');
});

it('keeps transport retry and unavailable membership states distinct', () => {
	const actions = mount({ status: 'Error' });
	expect(renderedText()).toContain('Check your connection and try again.');
	press('Try again');
	expect(actions.onRetry).toHaveBeenCalledTimes(1);
	act(() =>
		renderer.update(
			createElement(CommunityHome, {
				state: { status: 'Unavailable' },
				onRetry: actions.onRetry,
				onReturn: actions.onReturn,
				onInvite: actions.onInvite,
			}),
		),
	);
	expect(renderedText()).toContain('Your membership may have changed');
	expect(renderedText()).not.toContain('Try again');
	press('Your communities');
	expect(actions.onReturn).toHaveBeenCalledTimes(1);
});

it('exposes the community title and state titles as screen-reader headings', () => {
	mount({
		status: 'Ready',
		context: communityContext({ role: 'Member', memberCount: 2 }),
	});
	const headings = renderer.root.findAllByProps({
		accessibilityRole: 'header',
	});
	expect(headings.length).toBeGreaterThanOrEqual(2);
});
