import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import AdminLayout from '../../../../app/(app)/(admin)/_layout';
import SettingsLayout from '../../../../app/(app)/(tabs)/settings/_layout';

jest.mock('react-native-reanimated', () => ({
	useSharedValue: () => ({ value: 0, set: jest.fn() }),
}));
jest.mock('expo-router', () => {
	const React = jest.requireActual('react');
	const { useHeaderScroll } = jest.requireActual(
		'@td/providers/header-scroll/header-scroll.hook',
	);
	const MockStack = ({ children }: { children: React.ReactNode }) => {
		useHeaderScroll();
		return React.createElement('Stack', {}, children);
	};
	const MockStackScreen = ({
		options,
	}: {
		options?: { header?: () => React.ReactNode };
	}) => (options?.header ? options.header() : null);
	MockStack.Screen = MockStackScreen;
	return {
		Stack: MockStack,
		Redirect: 'Redirect',
		useRouter: () => ({
			canGoBack: () => false,
			back: jest.fn(),
			replace: jest.fn(),
		}),
	};
});
jest.mock(
	'@td/features/communities/use-community-safety-review-access.hook',
	() => ({
		useCommunitySafetyReviewAccess: () => ({
			status: 'Ready',
			retry: jest.fn(),
		}),
	}),
);
jest.mock(
	'@td/components/ui/main-header/components/header-top-row/header-top-row.component',
	() => ({
		HeaderTopRow: 'HeaderTopRow',
	}),
);
jest.mock('@td/components/ui/error-state/error-state.component', () => ({
	ErrorState: 'ErrorState',
}));
jest.mock('@td/components/ui/loading-state/loading-state.component', () => ({
	LoadingState: 'LoadingState',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const checkLayout = (layout: React.ComponentType, titles: string[]) => {
	let renderer!: ReactTestRenderer;
	act(() => {
		renderer = create(createElement(layout));
	});
	for (const title of titles) {
		const header = renderer.root
			.findAll((node) => String(node.type) === 'HeaderTopRow')
			.find((node) => node.props['title'] === title);
		expect(header).toBeDefined();
		expect(header?.props['scrollOffset']).toBeDefined();
	}
	act(() => renderer.unmount());
};

it('provides scroll context to the new Settings screens and their headers', () => {
	checkLayout(SettingsLayout, [
		'Progress sharing',
		'Blocked members',
		'Shared Contributions',
	]);
});

it('provides scroll context to safety review screens and their headers', () => {
	checkLayout(AdminLayout, ['Safety reports', 'Review report']);
});
