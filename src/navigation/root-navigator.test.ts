import { useAuth } from '@td/providers/auth/auth.hook';
import type { IAuthContextValue } from '@td/providers/auth/auth.types';
import { createElement, type ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { RootNavigator } from './root-navigator.component';

jest.mock('@td/providers/auth/auth.hook', () => ({ useAuth: jest.fn() }));
jest.mock('@td/components/layout/root/root-layout.styles', () => ({
	StackContentStyle: {},
}));
jest.mock('@td/components/ui/error-state/error-state.component', () => ({
	ErrorState: () => 'account-error',
}));
jest.mock('@td/components/ui/loading-state/loading-state.component', () => ({
	LoadingState: () => 'account-loading',
}));
jest.mock('expo-router', () => {
	const Stack = ({ children }: { children: ReactNode }) => children;
	const Screen = ({ name }: { name: string }) => name;
	Stack.Screen = Screen;
	const Protected = ({
		guard,
		children,
	}: {
		guard: boolean;
		children: ReactNode;
	}) => (guard ? children : null);
	Stack.Protected = Protected;
	return { Stack };
});

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let renderer: ReactTestRenderer;
const mockSession = (
	state: Pick<
		IAuthContextValue,
		'account' | 'isInitializing' | 'initializationError'
	>,
) => {
	jest.mocked(useAuth).mockReturnValue({
		isProfileReady: true,
		...state,
	} as IAuthContextValue);
};
const render = () => {
	act(() => {
		renderer = create(createElement(RootNavigator));
	});
};
afterEach(() => {
	act(() => renderer.unmount());
});

it('does not mount a navigator while the saved session is loading', () => {
	mockSession({
		account: null,
		isInitializing: true,
		initializationError: null,
	});
	render();
	expect(renderer.toJSON()).toBe('account-loading');
});

it('fails closed when session restoration fails', () => {
	mockSession({
		account: {
			userId: 'account-1',
			contactEmail: null,
			isEmailConfirmed: true,
		},
		isInitializing: false,
		initializationError: new Error('offline'),
	});
	render();
	expect(renderer.toJSON()).toBe('account-error');
});

it('switches available route groups as sign-in, verification, and sign-out happen', () => {
	const account = {
		userId: 'account-1',
		contactEmail: 'reader@example.com',
		isEmailConfirmed: false,
	};
	const update = (nextAccount: IAuthContextValue['account']) => {
		mockSession({
			account: nextAccount,
			isInitializing: false,
			initializationError: null,
		});
		act(() => renderer.update(createElement(RootNavigator)));
	};
	mockSession({
		account: null,
		isInitializing: false,
		initializationError: null,
	});
	render();
	expect(renderer.toJSON()).toEqual(['(auth)', '(public)', '+not-found']);
	update(account);
	expect(renderer.toJSON()).toEqual(['(auth)', '(public)', '+not-found']);
	update({ ...account, isEmailConfirmed: true });
	expect(renderer.toJSON()).toEqual(['(app)', '(public)', '+not-found']);
	update(null);
	expect(renderer.toJSON()).toEqual(['(auth)', '(public)', '+not-found']);
});

it('blocks private routes for a verified account until its profile is saved', () => {
	mockSession({
		account: {
			userId: 'account-1',
			contactEmail: null,
			isEmailConfirmed: true,
		},
		isInitializing: false,
		initializationError: null,
	});
	jest.mocked(useAuth).mockReturnValue({
		...useAuth(),
		isProfileReady: false,
	});
	render();
	expect(renderer.toJSON()).toEqual(['(auth)', '(public)', '+not-found']);
});
