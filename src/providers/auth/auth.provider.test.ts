import { ensureAccountProfile } from '@td/features/account/account-profile.service';
import {
	authActions,
	subscribeToAccount,
} from '@td/services/firebase/firebase-auth.service';
import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';
import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useAuth } from './auth.hook';
import { AuthProvider } from './auth.provider';
import type { IAuthContextValue } from './auth.types';

jest.mock('@td/services/firebase/firebase-auth.service', () => ({
	authActions: { signUp: jest.fn() },
	subscribeToAccount: jest.fn(),
}));

jest.mock('@td/features/account/account-profile.service', () => ({
	ensureAccountProfile: jest.fn(),
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
	jest.resetAllMocks();
	jest.mocked(ensureAccountProfile).mockResolvedValue(undefined);
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

it('saves the signup name even when the auth listener fires before signup resolves', async () => {
	const identity = {
		userId: 'new-account',
		contactEmail: 'reader@example.com',
		isEmailConfirmed: false,
	};
	jest.mocked(authActions.signUp).mockImplementation(async () => {
		onAccount(identity);
		return identity;
	});
	await act(async () => {
		await current.signUp({
			email: 'READER@example.com',
			password: 'secret123',
			preferredName: 'Reader',
		});
	});
	expect(ensureAccountProfile).toHaveBeenCalledWith('new-account', 'Reader');
	expect(current.isProfileReady).toBe(true);
});

it('keeps a failed profile save retryable without repeating signup or losing the name', async () => {
	const identity = {
		userId: 'new-account',
		contactEmail: 'reader@example.com',
		isEmailConfirmed: false,
	};
	jest.mocked(authActions.signUp).mockImplementation(async () => {
		onAccount(identity);
		return identity;
	});
	jest.mocked(ensureAccountProfile).mockRejectedValueOnce(
		new Error('offline'),
	);
	await act(async () => {
		await current.signUp({
			email: 'reader@example.com',
			password: 'secret123',
			preferredName: 'Reader',
		});
	});
	expect(current.account).toEqual(identity);
	expect(current.isProfileReady).toBe(false);
	expect(current.profileError?.message).toBe('offline');
	await act(async () => current.retryAccountProfile());
	expect(ensureAccountProfile).toHaveBeenNthCalledWith(
		2,
		'new-account',
		'Reader',
	);
	expect(authActions.signUp).toHaveBeenCalledTimes(1);
	expect(current.isProfileReady).toBe(true);
	expect(current.profileError).toBeNull();
});

it('ensures a profile for a restored account without rerunning on email verification', async () => {
	const identity = {
		userId: 'returning-account',
		contactEmail: 'reader@example.com',
		isEmailConfirmed: false,
	};
	await act(async () => onAccount(identity));
	expect(ensureAccountProfile).toHaveBeenCalledWith(
		'returning-account',
		undefined,
	);
	expect(current.isProfileReady).toBe(true);
	await act(async () => onAccount({ ...identity, isEmailConfirmed: true }));
	expect(ensureAccountProfile).toHaveBeenCalledTimes(1);
});

it('ignores profile completion after signout or an account switch', async () => {
	let complete!: () => void;
	jest.mocked(ensureAccountProfile).mockImplementationOnce(
		() =>
			new Promise<void>((resolve) => {
				complete = resolve;
			}),
	);
	act(() =>
		onAccount({
			userId: 'first',
			contactEmail: 'first@example.com',
			isEmailConfirmed: true,
		}),
	);
	await act(async () =>
		onAccount({
			userId: 'second',
			contactEmail: 'second@example.com',
			isEmailConfirmed: false,
		}),
	);
	await act(async () => complete());
	expect(current.account?.userId).toBe('second');
	expect(current.isProfileReady).toBe(true);
	await act(async () => onAccount(null));
	expect(current.isProfileReady).toBe(false);
	expect(current.profileError).toBeNull();
});
