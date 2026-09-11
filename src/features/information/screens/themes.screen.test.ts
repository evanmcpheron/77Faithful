import { Modal } from '@td/components/layout/modal/modal.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { createElement, type ReactNode } from 'react';
import { Pressable } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ThemesScreen } from './themes.screen';

jest.mock('react-native', () => ({
	View: ({ children }: { children: ReactNode }) => children,
	Pressable: ({ children }: { children: ReactNode }) => children,
	ScrollView: ({ children }: { children: ReactNode }) => children,
	useWindowDimensions: () => ({ height: 667, width: 375 }),
}));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownScrollScreen: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@td/components/layout/modal/modal.component', () => ({
	Modal: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@td/components/ui/surface/surface.component', () => ({
	Surface: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@td/components/ui/icon/icon.component', () => ({
	AppIcon: () => null,
}));
jest.mock('@td/components/ui/icon/icon.types', () => ({
	IconName: { Arrow: 'Arrow' },
}));
jest.mock('@td/assets/images/themes/forest-sunrise.png', () => 1);
jest.mock('./themes.styles', () => {
	const wrapper = ({ children }: { children: ReactNode }) => children;
	return {
		StyledHeroCopy: wrapper,
		StyledHeroGradient: () => null,
		StyledHeroImage: () => null,
		StyledThemeCopy: wrapper,
		StyledThemeList: wrapper,
		StyledThemeRow: wrapper,
		StyledThemesContent: wrapper,
		StyledThemesHero: wrapper,
		StyledWeekBadge: wrapper,
		textStyles: {},
	};
});
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let renderer: ReactTestRenderer;
beforeEach(() => {
	act(() => {
		renderer = create(createElement(ThemesScreen));
	});
});
afterEach(() => {
	act(() => renderer.unmount());
});

it('opens the matching overview and day range for every week, then closes', () => {
	expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
	const rows = renderer.root.findAllByType(Pressable);
	expect(rows).toHaveLength(11);
	rows.forEach((row, index) => {
		act(() => row.props['onPress']());
		const modal = renderer.root.findByType(Modal);
		const copy = modal
			.findAllByType(Typography)
			.map((node) => [node.props['children']].flat().join(''));
		expect(copy).toContain(`WEEK ${index + 1}`);
		expect(copy).toContain(`Day ${index * 7 + 1} — ${(index + 1) * 7}`);
		expect(copy).toContain('ABOUT THIS WEEK');
		if (index === 3) {
			expect(copy).toContain('Renewal');
			expect(copy).toContain(
				'Becoming renewed in Christ through the ongoing work of God in your heart and mind.',
			);
			expect(copy).toContain(
				'Renewal is not about trying harder to become a better person. Scripture calls us to be transformed as God renews our minds and forms us into the likeness of Christ.',
			);
		}
		act(() => modal.findByType(TurndownButton).props['onPress']());
		expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
	});
});

it('dismisses through the shared modal close handler', () => {
	act(() => renderer.root.findAllByType(Pressable)[0]?.props['onPress']());
	act(() => renderer.root.findByType(Modal).props['onClose']());
	expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
});

jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@td/components/ui/divider/divider.component', () => ({
	Divider: () => null,
}));
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 44, bottom: 34 }),
}));
jest.mock('./theme-overview-modal.styles', () => {
	const wrapper = ({ children }: { children: ReactNode }) => children;
	return {
		StyledOverviewBody: wrapper,
		StyledOverviewFooter: wrapper,
		StyledOverviewHandle: wrapper,
		StyledOverviewRule: wrapper,
		StyledOverviewSection: wrapper,
		overviewTextStyles: {},
	};
});
