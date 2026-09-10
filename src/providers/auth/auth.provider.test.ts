import { subscribeToAccount } from '@td/services/firebase/firebase-auth.service';
import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';
import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useAuth } from './auth.hook';
import { AuthProvider } from './auth.provider';
import type { IAuthContextValue } from './auth.types';

jest.mock('@td/services/firebase/firebase-auth.service', () => ({
	authActions: {},
	subscribeToAccount: jest.fn(),
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let current: IAuthContextValue;
let renderer: ReactTestRenderer;
let onAccount: (account: IAuthenticatedAccountIdentity | null) => void;
let onError: (error: Error) => void;
const unsubscribe = jest.fn();
const Consumer = () => {
	const value = useAuth();
	useEffect(() => {
		current = value;
	}, [value]);
	return null;
};

beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(subscribeToAccount).mockImplementation((next, error) => {
		onAccount = next;
		onError = error;
		return unsubscribe;
	});
	act(() => {
		renderer = create(
			createElement(AuthProvider, { children: createElement(Consumer) }),
		);
	});
});

afterEach(() => {
	act(() => renderer.unmount());
});

it('waits for session restoration and follows sign-in, confirmation, and sign-out', () => {
	expect(current.isInitializing).toBe(true);
	const identity = {
		userId: 'account-1',
		contactEmail: 'reader@example.com',
		isEmailConfirmed: false,
	};
	act(() => onAccount(identity));
	expect(current.account).toEqual(identity);
	expect(current.isInitializing).toBe(false);
	act(() => onAccount({ ...identity, isEmailConfirmed: true }));
	expect(current.account?.isEmailConfirmed).toBe(true);
	act(() => onAccount(null));
	expect(current.account).toBeNull();
});

it('exposes initialization failure without leaving the provider loading', () => {
	const error = new Error('Session unavailable');
	act(() => onError(error));
	expect(current.initializationError).toBe(error);
	expect(current.account).toBeNull();
	expect(current.isInitializing).toBe(false);
});

it('unsubscribes when unmounted', () => {
	act(() => renderer.unmount());
	expect(unsubscribe).toHaveBeenCalledTimes(1);
});
