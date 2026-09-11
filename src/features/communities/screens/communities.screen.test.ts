import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import type { ICommunitySummary } from '@td/types/community/community.types';
import {
	CommunitiesScreen,
	type TCommunitiesScreenState,
} from './communities.screen';

jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native', () => ({
	View: 'View',
	Platform: { OS: 'web' },
	useColorScheme: () => 'light',
}));
jest.mock('react-native-reanimated', () => ({
	__esModule: true,
	default: { View: 'AnimatedView' },
	useSharedValue: () => ({ value: 0 }),
	useAnimatedStyle: (style: () => object) => style(),
	useReducedMotion: () => false,
}));
jest.mock('@td/features/auth/hooks/use-auth-header-animation.hook', () => ({
	useAuthHeaderAnimation: () => ({}),
}));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownScrollScreen: ({
		header,
		children,
	}: {
		header: React.ReactNode;
		children: React.ReactNode;
	}) => createElement('Screen', {}, header, children),
}));
jest.mock('@td/components/ui/spacer/spacer.component', () => ({
	Spacer: 'Spacer',
}));
jest.mock('@td/features/today/screens/today.styles', () => ({
	StyledTodaySummaryCard: 'SummaryCard',
	StyledTodaySummaryCards: 'SummaryCards',
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'Button',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'Card' }));
jest.mock('@td/components/ui/card/card.styles', () => ({
	StyledCard: 'CommunityCard',
}));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
jest.mock('@td/features/auth/components/auth-header.component', () => ({
	AuthHeaderBackground: 'Landscape',
}));
jest.mock('@td/features/auth/screens/auth.styles', () => ({
	StyledAuthBodyContainer: 'Body',
	StyledAuthHeaderContent: 'Header',
	StyledAuthHeaderSafeArea: 'SafeArea',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let renderer: ReactTestRenderer;
const mount = (state?: TCommunitiesScreenState) => {
	act(() => {
		renderer = create(
			createElement(CommunitiesScreen, state ? { state } : {}),
		);
	});
};
const text = () => JSON.stringify(renderer.toJSON());
const press = (label: string) => {
	const button = renderer.root.find(
		(node) =>
			String(node.type) === 'Button' && node.props['children'] === label,
	);
	act(() => button.props['onPress']());
};
afterEach(() => {
	act(() => renderer.unmount());
	jest.clearAllMocks();
});

it('does not present the missing integration as an empty membership list', () => {
	mount();
	expect(text()).toContain('Communities aren’t available yet.');
	expect(text()).not.toContain('Faith is lived together.');
});
it('keeps loading and failed loading distinct from empty, and retries failures', () => {
	mount({ status: 'Loading' });
	expect(text()).toContain('Loading your communities…');
	expect(text()).not.toContain('Faith is lived together.');
	const retry = jest.fn();
	act(() =>
		renderer.update(
			createElement(CommunitiesScreen, {
				state: { status: 'Error', onRetry: retry },
			}),
		),
	);
	expect(text()).toContain('We couldn’t load your communities.');
	expect(text()).not.toContain('Faith is lived together.');
	press('Try again');
	expect(retry).toHaveBeenCalledTimes(1);
});
it('offers joining first for a confirmed empty list and uses the existing action routes', () => {
	mount({ status: 'Ready', communities: [] });
	expect(text()).toContain('Faith is lived together.');
	const actions = renderer.root.findAll(
		(node) => String(node.type) === 'Button',
	);
	expect(actions.map((node) => node.props['children'])).toEqual([
		'Join a community',
		'Create a community',
	]);
	press('Join a community');
	press('Create a community');
	expect(mockPush.mock.calls).toEqual([
		['/communities/join'],
		['/communities/create'],
	]);
});
it('shows supplied community details without invented activity and opens the selected community', () => {
	const community: ICommunitySummary = {
		communityId: 'evening-prayer',
		name: 'Evening prayer with our neighbors and friends',
		purpose: 'Pray together each week.',
		organizer: { userId: 'organizer', displayName: 'Anna' },
		status: 'Active',
	};
	mount({ status: 'Ready', communities: [community] });
	expect(text()).toContain(community.name);
	expect(text()).toContain(community.purpose);
	expect(text()).toContain('Anna');
	expect(text()).not.toMatch(/unread|members|Faith is lived together/);
	const card = renderer.root.find(
		(node) => String(node.type) === 'CommunityCard',
	);
	expect(card.props['accessibilityRole']).toBe('link');
	act(() => card.props['onPress']());
	expect(mockPush).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]',
		params: { communityId: 'evening-prayer' },
	});
});

it('shows the two header cards only when their content is supplied', () => {
	mount();
	expect(
		renderer.root.findAll((node) => String(node.type) === 'SummaryCard'),
	).toHaveLength(0);
	act(() =>
		renderer.update(
			createElement(CommunitiesScreen, {
				headerCards: ['First card', 'Second card'],
			}),
		),
	);
	const cards = renderer.root.findAll(
		(node) => String(node.type) === 'SummaryCard',
	);
	expect(cards.map((card) => card.props['children'])).toEqual([
		'First card',
		'Second card',
	]);
});

it('fills the remaining viewport and recalculates it after resizing or header growth', () => {
	mount();
	const viewport = renderer.root.findByProps({
		testID: 'communities-viewport',
	});
	const header = renderer.root.findByProps({ testID: 'communities-header' });
	act(() => {
		viewport.props['onLayout']({
			nativeEvent: { layout: { height: 900 } },
		});
		header.props['onLayout']({ nativeEvent: { layout: { height: 458 } } });
	});
	const body = () =>
		renderer.root.find((node) => String(node.type) === 'Body');
	expect(body().props['style']).toContainEqual({ minHeight: 474 });
	act(() => {
		viewport.props['onLayout']({
			nativeEvent: { layout: { height: 800 } },
		});
		header.props['onLayout']({ nativeEvent: { layout: { height: 500 } } });
	});
	expect(body().props['style']).toContainEqual({ minHeight: 332 });
});
