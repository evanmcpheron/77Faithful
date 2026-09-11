import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import JourneyLayout from '../../../app/(app)/(tabs)/(journey)/_layout';
const router = {
	back: jest.fn(),
	replace: jest.fn(),
	navigate: jest.fn(),
	canGoBack: jest.fn(() => true),
};
jest.mock('expo-router', () => ({
	useRouter: () => router,
	Stack: Object.assign(({ children }: { children: unknown }) => children, {
		Screen: 'screen',
	}),
}));
jest.mock(
	'@td/components/ui/main-header/components/header-top-row/header-top-row.component',
	() => ({ HeaderTopRow: 'header' }),
);
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let renderer: ReactTestRenderer;
beforeEach(async () => {
	jest.clearAllMocks();
	router.canGoBack.mockReturnValue(true);
	await act(async () => {
		renderer = create(createElement(JourneyLayout));
	});
});
afterEach(async () => {
	await act(async () => renderer.unmount());
});
const back = (returnTo?: string) => {
	const screen = renderer.root.findByProps({
		name: 'journeys/[journeyId]/days/[dayNumber]/reflection',
	});
	const options = screen.props['options']({
		route: { params: { dayNumber: '4', returnTo } },
	});
	options.header().props.onBackPress();
};
it('returns to the existing Reflections list when the entry was opened there', () => {
	back('reflections');
	expect(router.back).toHaveBeenCalledTimes(1);
	expect(router.navigate).not.toHaveBeenCalled();
});
it('falls back to Reflections when history is unavailable', () => {
	router.canGoBack.mockReturnValue(false);
	back('reflections');
	expect(router.replace).toHaveBeenCalledWith('/reflections');
});
it('preserves Today navigation for daily practice entries', () => {
	back();
	expect(router.navigate).toHaveBeenCalledWith('/today');
});
