import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import CommunitiesLayout from '../../../../app/(app)/(tabs)/communities/_layout';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = false;
jest.mock('expo-router', () => {
	const { createElement: createReactElement } = jest.requireActual('react');
	const MockStack = ({ children }: { children: React.ReactNode }) =>
		createReactElement('Stack', {}, children);
	MockStack.Screen = 'StackScreen';
	return {
		Stack: MockStack,
		useLocalSearchParams: () => ({ communityId: 'group' }),
		useRouter: () => ({
			canGoBack: () => mockCanGoBack,
			back: mockBack,
			replace: mockReplace,
		}),
	};
});
jest.mock('@td/providers/header-scroll/header-scroll.provider', () => ({
	HeaderScrollProvider: ({ children }: { children: React.ReactNode }) =>
		children,
}));
jest.mock('@td/providers/header-scroll/header-scroll.hook', () => ({
	useHeaderScroll: () => ({ scrollOffset: { value: 0 } }),
}));
jest.mock(
	'@td/components/ui/main-header/components/header-top-row/header-top-row.component',
	() => ({ HeaderTopRow: 'HeaderTopRow' }),
);
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let renderer: ReactTestRenderer;
beforeEach(() => {
	mockCanGoBack = false;
	jest.clearAllMocks();
	act(() => {
		renderer = create(createElement(CommunitiesLayout));
	});
});
afterEach(() => act(() => renderer.unmount()));

it('provides an accessible detail back header with a cold-open list fallback', () => {
	const detail = renderer.root.findByProps({ name: '[communityId]/index' });
	let header!: ReactTestRenderer;
	act(() => {
		header = create(detail.props['options'].header());
	});
	const topRow = header.root.find(
		(node) => String(node.type) === 'HeaderTopRow',
	);
	expect(topRow.props['canGoBack']).toBe(true);
	expect(topRow.props['title']).toBe('Community');
	expect(topRow.props['showNotifications']).toBe(false);
	act(() => topRow.props['onBackPress']());
	expect(mockReplace).toHaveBeenCalledWith('/communities');
	expect(mockBack).not.toHaveBeenCalled();

	mockCanGoBack = true;
	act(() => topRow.props['onBackPress']());
	expect(mockBack).toHaveBeenCalledTimes(1);
	act(() => header.unmount());
});

it('provides the join flow with a back-enabled top bar and list fallback', () => {
	const join = renderer.root.findByProps({ name: 'join' });
	let header!: ReactTestRenderer;
	act(() => {
		header = create(join.props['options'].header());
	});
	const topRow = header.root.find(
		(node) => String(node.type) === 'HeaderTopRow',
	);
	expect(topRow.props['canGoBack']).toBe(true);
	expect(topRow.props['title']).toBe('Join community');
	expect(topRow.props['showNotifications']).toBe(false);
	act(() => topRow.props['onBackPress']());
	expect(mockReplace).toHaveBeenCalledWith('/communities');

	mockCanGoBack = true;
	act(() => topRow.props['onBackPress']());
	expect(mockBack).toHaveBeenCalledTimes(1);
	act(() => header.unmount());
});

it('returns a cold-open invitation route to its community', () => {
	const invitation = renderer.root.findByProps({
		name: '[communityId]/invite',
	});
	let header!: ReactTestRenderer;
	act(() => {
		header = create(invitation.props['options'].header());
	});
	const topRow = header.root.find(
		(node) => String(node.type) === 'HeaderTopRow',
	);
	expect(topRow.props['canGoBack']).toBe(true);
	expect(topRow.props['title']).toBe('Invite people');
	act(() => topRow.props['onBackPress']());
	expect(mockReplace).toHaveBeenCalledWith({
		pathname: '/communities/[communityId]',
		params: { communityId: 'group' },
	});
	act(() => header.unmount());
});
