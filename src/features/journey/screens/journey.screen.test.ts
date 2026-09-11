import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { JourneyScreen } from './journey.screen';

jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
const mockRefresh = jest.fn();
let mockToday = {
	data: null as { status: 'NoActiveJourney' } | null,
	session: null,
	error: null as string | null,
	refresh: mockRefresh,
};
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

jest.mock('@td/components/ui/icon/icon.types', () => ({
	IconName: { Note: 'Note', Lock: 'Lock' },
}));
jest.mock(
	'@td/components/ui/navigation-action-list/navigation-action-list.component',
	() => ({ NavigationActionList: 'NavigationActionList' }),
);
jest.mock('@td/components/ui/progress-bar/progress-bar.component', () => ({
	ProgressBar: 'ProgressBar',
}));
jest.mock('@td/features/today/use-today.hook', () => ({
	useToday: () => mockToday,
}));
jest.mock('styled-components/native', () => ({
	__esModule: true,
	default: { View: () => 'StyledView' },
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let renderer: ReactTestRenderer;
beforeEach(() => {
	mockToday = {
		data: null,
		session: null,
		error: null,
		refresh: mockRefresh,
	};
	jest.clearAllMocks();
});
afterEach(() => {
	act(() => renderer.unmount());
});
const mount = () => {
	act(() => {
		renderer = create(createElement(JourneyScreen));
	});
};
it('keeps loading and retryable errors inside the journey body panel', () => {
	mount();
	const body = () =>
		renderer.root.find((node) => String(node.type) === 'Body');
	expect(
		body().findAll(
			(node) => node.props['children'] === 'Loading your journey…',
		),
	).toHaveLength(1);
	mockToday.error = 'Request failed';
	act(() => renderer.update(createElement(JourneyScreen)));
	expect(JSON.stringify(renderer.toJSON())).not.toContain(
		'No active journey',
	);
	const retry = body().find((node) => String(node.type) === 'Button');
	act(() => retry.props['onPress']());
	expect(mockRefresh).toHaveBeenCalledTimes(1);
});
it('preserves journey destinations and private-writing copy with no active journey', () => {
	mockToday.data = { status: 'NoActiveJourney' };
	mount();
	expect(JSON.stringify(renderer.toJSON())).toContain(
		'Your reflections and personal writing remain private.',
	);
	const navigation = renderer.root.find(
		(node) => String(node.type) === 'NavigationActionList',
	);
	act(() => {
		navigation.props['actions'][0].onPress();
		navigation.props['actions'][1].onPress();
	});
	expect(mockPush.mock.calls).toEqual([['/themes'], ['/reflections']]);
});
