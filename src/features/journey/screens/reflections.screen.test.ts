import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useReflections } from '../use-reflections.hook';
import { ReflectionsScreen } from './reflections.screen';
const push = jest.fn();
jest.mock('../use-reflections.hook');
jest.mock('../reflections.assets', () => ({
	reflectionAssets: { quote: 'approved-psalm-png' },
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 100,
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push }) }));
jest.mock('react-native', () => ({
	View: 'view',
	useColorScheme: () => 'light',
	useWindowDimensions: () => ({ fontScale: 1 }),
}));
jest.mock('@td/assets/icons/reading/book-open.svg', () => 'book');
jest.mock('@td/assets/icons/prayer/leaf.svg', () => 'leaf');
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownScrollScreen: 'screen',
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'button',
}));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'text',
}));
jest.mock('@td/components/ui/icon/icon.component', () => ({ AppIcon: 'icon' }));
jest.mock('@td/components/ui/icon/icon.types', () => ({
	IconName: { ClipboardPencil: 'pen', ArrowRight: 'arrow' },
}));
jest.mock('./reflections.styles', () => ({
	...Object.fromEntries(
		[
			'ReflectionAction',
			'ReflectionActions',
			'ReflectionBookButton',
			'ReflectionCircle',
			'ReflectionContent',
			'ReflectionDivider',
			'ReflectionEntryCopy',
			'ReflectionEntryRow',
			'ReflectionFeatured',
			'ReflectionFooter',
			'ReflectionFooterBranch',
			'ReflectionHeader',
			'ReflectionHeadingRow',
			'ReflectionHero',
			'ReflectionHeroBranch',
			'ReflectionHeroText',
			'ReflectionQuoteImage',
			'ReflectionSection',
		].map((name) => [name, name]),
	),
	reflectionPalettes: { light: {} },
	reflectionTextStyles: {},
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let renderer: ReactTestRenderer;
const refresh = jest.fn();
const older = jest.fn();
const newer = jest.fn();
beforeEach(() => {
	push.mockClear();
	refresh.mockClear();
	jest.mocked(useReflections).mockReturnValue({
		entries: [],
		error: false,
		refresh,
		hasOlder: false,
		hasNewer: false,
		older,
		newer,
	});
});
afterEach(async () => {
	await act(async () => renderer?.unmount());
});
const render = async () => {
	await act(async () => {
		renderer = create(createElement(ReflectionsScreen));
	});
};
const text = () => JSON.stringify(renderer.toJSON());
it('shows the honest empty state without sample reflections', async () => {
	await render();
	expect(text()).toContain('Your saved reflections will appear here.');
	expect(
		renderer.root.findAllByType('ReflectionFeatured' as never),
	).toHaveLength(0);
});
it('keeps Write, Remember, and Grow informational', async () => {
	await render();
	const descriptions = renderer.root.findAllByType(
		'ReflectionAction' as never,
	);
	expect(descriptions).toHaveLength(3);
	for (const description of descriptions) {
		expect(description.props['onPress']).toBeUndefined();
		expect(description.props['accessibilityRole']).not.toBe('button');
	}
	expect(
		renderer.root.findAllByProps({
			accessibilityLabel: 'Open today’s Scripture',
		}),
	).toHaveLength(0);
	expect(
		renderer.root.findByType('ReflectionQuoteImage' as never).props[
			'source'
		],
	).toBe('approved-psalm-png');
});
it('requests older history without expanding the current page and opens the selected day', async () => {
	jest.mocked(useReflections).mockReturnValue({
		entries: Array.from({ length: 4 }, (_, i) => ({
			userId: 'owner',
			journeyId: 'past',
			dayNumber: i + 1,
			calendarDate: '2026-09-01',
			reflection: null,
		})),
		error: false,
		refresh,
		hasOlder: true,
		hasNewer: false,
		older,
		newer,
	});
	await render();
	expect(
		renderer.root.findAllByType('ReflectionEntryRow' as never),
	).toHaveLength(3);
	await act(async () =>
		renderer.root.findAllByType('button' as never)[1]!.props['onPress'](),
	);
	expect(
		renderer.root.findAllByType('ReflectionEntryRow' as never),
	).toHaveLength(3);
	expect(older).toHaveBeenCalled();
	await act(async () =>
		renderer.root
			.findAllByType('ReflectionEntryRow' as never)[2]!
			.props['onPress'](),
	);
	expect(push).toHaveBeenCalledWith({
		pathname: '/journeys/[journeyId]/days/[dayNumber]/reflection',
		params: { journeyId: 'past', dayNumber: '4', returnTo: 'reflections' },
	});
});
it('offers retry on failure without presenting an empty history', async () => {
	jest.mocked(useReflections).mockReturnValue({
		entries: null,
		error: true,
		refresh,
		hasOlder: false,
		hasNewer: false,
		older,
		newer,
	});
	await render();
	expect(text()).toContain('We couldn’t load your reflections.');
	expect(text()).not.toContain('Your saved reflections will appear here.');
	await act(async () =>
		renderer.root.findByType('button' as never).props['onPress'](),
	);
	expect(refresh).toHaveBeenCalledTimes(1);
});
