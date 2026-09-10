import { useAuth } from '@td/providers/auth/auth.hook';
import type { IAuthContextValue } from '@td/providers/auth/auth.types';
import { useJourneyAccess } from '@td/providers/journey/journey-access.provider';
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

jest.mock('@td/providers/journey/journey-access.provider', () => ({
	useJourneyAccess: jest.fn(),
}));
beforeEach(() => {
	jest.mocked(useJourneyAccess).mockReturnValue({
		hasJourney: true,
		isLoading: false,
		hasError: false,
		retry: jest.fn(),
	});
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

it('routes an eligible account without a journey into setup and opens the app after confirmation', () => {
	mockSession({
		account: {
			userId: 'owner',
			contactEmail: 'reader@example.com',
			isEmailConfirmed: true,
		},
		isInitializing: false,
		initializationError: null,
	});
	jest.mocked(useJourneyAccess).mockReturnValue({
		hasJourney: false,
		isLoading: false,
		hasError: false,
		retry: jest.fn(),
	});
	render();
	expect(renderer.toJSON()).toEqual(['onboarding', '(public)', '+not-found']);
	jest.mocked(useJourneyAccess).mockReturnValue({
		hasJourney: true,
		isLoading: false,
		hasError: false,
		retry: jest.fn(),
	});
	act(() => renderer.update(createElement(RootNavigator)));
	expect(renderer.toJSON()).toEqual(['(app)', '(public)', '+not-found']);
});
it('does not infer missing setup while journey access is loading or failed', () => {
	mockSession({
		account: {
			userId: 'owner',
			contactEmail: 'reader@example.com',
			isEmailConfirmed: true,
		},
		isInitializing: false,
		initializationError: null,
	});
	jest.mocked(useJourneyAccess).mockReturnValue({
		hasJourney: false,
		isLoading: true,
		hasError: false,
		retry: jest.fn(),
	});
	render();
	expect(renderer.toJSON()).toBe('account-loading');
	jest.mocked(useJourneyAccess).mockReturnValue({
		hasJourney: false,
		isLoading: false,
		hasError: true,
		retry: jest.fn(),
	});
	act(() => renderer.update(createElement(RootNavigator)));
	expect(renderer.toJSON()).toBe('account-error');
});
