import { createElement, type ReactNode } from 'react';
import { Linking, ScrollView } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { TurndownButton } from '@td/components/ui/button/button.component';

import { SupportScreen } from './support.screen';

jest.mock('react-native', () => ({
	View: ({ children }: { children: ReactNode }) => children,
	ScrollView: ({ children }: { children: ReactNode }) => children,
	Linking: { openURL: jest.fn() },
}));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownStaticScreen: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('./support.styles', () => ({ styles: {} }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('react-native-svg', () => ({
	__esModule: true,
	default: () => null,
	Path: () => null,
}));
jest.mock('@td/components/ui/icon/icon.component', () => ({
	AppIcon: () => null,
}));
jest.mock('@td/components/ui/icon/icon.types', () => ({
	IconName: { UsersFilled: 'UsersFilled', ArrowRight: 'ArrowRight' },
}));
jest.mock('@td/components/ui/surface/surface.component', () => ({
	Surface: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@td/assets/images/support/olive-landscape.png', () => 1);
jest.mock('@td/assets/images/support/watercolor-footer-supplied.png', () => 2);

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let renderer: ReactTestRenderer;

beforeEach(() => {
	jest.resetAllMocks();
	act(() => {
		renderer = create(createElement(SupportScreen));
	});
});

afterEach(() => {
	act(() => renderer.unmount());
});

it('uses a static screen without a scroll container or photo caption', () => {
	expect(renderer.root.findAllByType(ScrollView)).toHaveLength(0);
	expect(JSON.stringify(renderer.toJSON())).not.toContain('A BRIGHTER');
});

it('only opens the supplied website after a deliberate contribution action', async () => {
	expect(Linking.openURL).not.toHaveBeenCalled();
	await act(async () => {
		renderer.root.findByType(TurndownButton).props['onPress']();
	});
	expect(Linking.openURL).toHaveBeenCalledTimes(1);
	expect(Linking.openURL).toHaveBeenCalledWith('https://wwww.77faithful.com');
});

it('allows retry after the browser fails without claiming a contribution succeeded', async () => {
	jest.mocked(Linking.openURL).mockRejectedValueOnce(
		new Error('unavailable'),
	);
	await act(async () => {
		renderer.root.findByType(TurndownButton).props['onPress']();
	});
	expect(JSON.stringify(renderer.toJSON())).toContain(
		'We could not open the contribution page. Please try again.',
	);
	expect(renderer.root.findByType(TurndownButton).props['loading']).toBe(
		false,
	);
	await act(async () => {
		renderer.root.findByType(TurndownButton).props['onPress']();
	});
	expect(Linking.openURL).toHaveBeenCalledTimes(2);
	expect(JSON.stringify(renderer.toJSON())).not.toContain(
		'Please try again.',
	);
	expect(JSON.stringify(renderer.toJSON())).not.toContain('Thank you');
});
