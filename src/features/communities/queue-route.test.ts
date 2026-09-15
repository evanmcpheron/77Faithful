import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import AdminLayout from '../../../app/(app)/(admin)/_layout';

let accessStatus = 'Loading';
const mockRetry = jest.fn();
const mockReplace = jest.fn();
jest.mock(
	'@td/features/communities/use-community-safety-review-access.hook',
	() => ({
		useCommunitySafetyReviewAccess: () => ({
			status: accessStatus,
			retry: mockRetry,
		}),
	}),
);
jest.mock('expo-router', () => ({
	Redirect: 'Redirect',
	Stack: Object.assign(
		({ children }: { children: React.ReactNode }) => {
			const React = jest.requireActual('react') as typeof import('react');
			return React.createElement('Stack', {}, children);
		},
		{ Screen: 'StackScreen' },
	),
	useRouter: () => ({ canGoBack: () => false, replace: mockReplace }),
}));
jest.mock(
	'@td/components/ui/main-header/components/header-top-row/header-top-row.component',
	() => ({ HeaderTopRow: 'Header' }),
);
jest.mock('@td/components/ui/error-state/error-state.component', () => ({
	ErrorState: 'Error',
}));
jest.mock('@td/components/ui/loading-state/loading-state.component', () => ({
	LoadingState: 'Loading',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const render = (): ReactTestRenderer => {
	let result!: ReactTestRenderer;
	act(() => {
		result = create(createElement(AdminLayout));
	});
	return result;
};

it('keeps the queue unmounted while claims load and redirects denied direct routes', () => {
	accessStatus = 'Loading';
	let tree = render();
	expect(
		tree.root.findAll((node) => String(node.type) === 'StackScreen'),
	).toHaveLength(0);
	act(() => tree.unmount());
	accessStatus = 'Denied';
	tree = render();
	expect(
		tree.root.findAll((node) => String(node.type) === 'Redirect'),
	).toHaveLength(1);
	expect(
		tree.root.findAll((node) => String(node.type) === 'StackScreen'),
	).toHaveLength(0);
	act(() => tree.unmount());
});

it('mounts the queue route only after verified reviewer access', () => {
	accessStatus = 'Allowed';
	const tree = render();
	expect(
		tree.root.findAll((node) => String(node.type) === 'StackScreen'),
	).toHaveLength(2);
	act(() => tree.unmount());
});
