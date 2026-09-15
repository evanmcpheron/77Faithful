import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { SettingsScreen } from './settings.screen';

const mockPush = jest.fn();
let safetyAccessStatus: 'Allowed' | 'Denied' = 'Denied';
let renderer: ReactTestRenderer;

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'Gradient' }));
jest.mock('@td/components/ui/icon/icon.types', () => ({
	IconName: { Identification: 'Identification', Note: 'Note', Lock: 'Lock' },
}));
jest.mock('react-native', () => ({ View: 'View' }));
jest.mock('react-native-reanimated', () => ({
	__esModule: true,
	default: { View: 'AnimatedView' },
	useAnimatedStyle: () => ({}),
	useReducedMotion: () => true,
	useSharedValue: () => ({ value: 0 }),
}));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownScrollScreen: 'Screen',
}));
jest.mock(
	'@td/components/ui/navigation-action-list/navigation-action-list.component',
	() => ({ NavigationActionList: 'Actions' }),
);
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
jest.mock('@td/features/auth/components/auth-header.component', () => ({
	AuthHeaderBackground: 'Background',
}));
jest.mock('@td/features/auth/hooks/use-auth-header-animation.hook', () => ({
	useAuthHeaderAnimation: () => ({}),
}));
jest.mock('@td/features/auth/screens/auth.styles', () => ({
	StyledAuthBodyContainer: 'Body',
	StyledAuthHeaderContent: 'HeaderContent',
	StyledAuthHeaderSafeArea: 'HeaderSafeArea',
}));
jest.mock(
	'@td/features/communities/use-community-safety-review-access.hook',
	() => ({
		useCommunitySafetyReviewAccess: () => ({ status: safetyAccessStatus }),
	}),
);
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({
		account: { userId: 'owner', contactEmail: 'owner@example.com' },
	}),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

it('offers Shared Contributions from signed-in Settings without community state', () => {
	safetyAccessStatus = 'Denied';
	act(() => {
		renderer = create(createElement(SettingsScreen));
	});
	const actions = renderer.root.findAll(
		(node) => String(node.type) === 'Actions',
	);
	const entry = actions.find(
		(node) => node.props['actions']?.id === 'shared-contributions',
	);
	expect(entry).toBeDefined();
	act(() => {
		entry?.props['actions'].onPress();
	});
	expect(mockPush).toHaveBeenCalledWith('/settings/shared-contributions');
	const progressEntry = actions.find(
		(node) => node.props['actions']?.id === 'progress-sharing',
	);
	expect(progressEntry).toBeDefined();
	act(() => {
		progressEntry?.props['actions'].onPress();
	});
	expect(mockPush).toHaveBeenCalledWith('/settings/progress-sharing');
	expect(
		actions.some((node) => node.props['actions']?.id === 'safety-reports'),
	).toBe(false);
});

it('shows the restricted queue entry only after reviewer access is verified', () => {
	safetyAccessStatus = 'Allowed';
	act(() => {
		renderer = create(createElement(SettingsScreen));
	});
	const entry = renderer.root
		.findAll((node) => String(node.type) === 'Actions')
		.find((node) => node.props['actions']?.id === 'safety-reports');
	expect(entry).toBeDefined();
	act(() => {
		entry?.props['actions'].onPress();
	});
	expect(mockPush).toHaveBeenCalledWith('/safety-reports');
});
