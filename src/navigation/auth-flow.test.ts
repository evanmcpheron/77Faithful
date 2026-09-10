import { showErrorNotification } from '@td/components/ui/notification/notification.helper';
import { ensureAccountProfile } from '@td/features/account/account-profile.service';
import { useAuthActions } from '@td/features/auth/hooks/use-auth-actions.hook';
import { useAuth } from '@td/providers/auth/auth.hook';
import { AuthProvider } from '@td/providers/auth/auth.provider';
import {
	authActions,
	subscribeToAccount,
} from '@td/services/firebase/firebase-auth.service';
import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { getAuthRouteRedirect } from './auth-route-access';

jest.mock('@td/services/firebase/firebase-auth.service', () => ({
	authActions: {
		signIn: jest.fn(),
		signUp: jest.fn(),
		sendEmailVerification: jest.fn(),
	},
	subscribeToAccount: jest.fn(),
}));
jest.mock('@td/components/ui/notification/notification.helper', () => ({
	showErrorNotification: jest.fn(),
}));

jest.mock('@td/features/account/account-profile.service', () => ({
	ensureAccountProfile: jest.fn(),
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const account: IAuthenticatedAccountIdentity = {
	userId: 'account-1',
	contactEmail: 'reader@example.com',
	isEmailConfirmed: false,
};
const values = {
	email: 'reader@example.com',
	password: 'secret123',
	confirmPassword: 'secret123',
	termsAccepted: true,
};
let onAccount: (next: IAuthenticatedAccountIdentity | null) => void;
let submit: ReturnType<typeof useAuthActions>['submit'];
let renderer: ReactTestRenderer;

const mount = (mode: 'signIn' | 'signUp') => {
	const Consumer = () => {
		const { account: currentAccount, isProfileReady } = useAuth();
		submit = useAuthActions(mode).submit;
		return getAuthRouteRedirect(
			currentAccount,
			mode === 'signIn' ? '/' : '/register',
			isProfileReady,
		);
	};
	act(() => {
		renderer = create(
			createElement(AuthProvider, { children: createElement(Consumer) }),
		);
	});
};

beforeEach(() => {
	jest.resetAllMocks();
	jest.mocked(ensureAccountProfile).mockResolvedValue(undefined);
	jest.mocked(subscribeToAccount).mockImplementation((next) => {
		onAccount = next;
		next(null);
		return jest.fn();
	});
	for (const action of [authActions.signIn, authActions.signUp]) {
		jest.mocked(action).mockImplementation(async () => {
			onAccount(account);
			return account;
		});
	}
});
afterEach(() => act(() => renderer.unmount()));

it.each(['signIn', 'signUp'] as const)(
	'routes an unverified account to confirmation after %s',
	async (mode) => {
		mount(mode);
		expect(renderer.toJSON()).toBeNull();
		await act(async () => submit(values));
		expect(renderer.toJSON()).toBe('/confirm-email');
		act(() => onAccount({ ...account, isEmailConfirmed: true }));
		expect(renderer.toJSON()).toBe('/today');
	},
);

it('routes to confirmation while signup email delivery is still pending or fails', async () => {
	let rejectDelivery!: (error: Error) => void;
	jest.mocked(authActions.sendEmailVerification).mockImplementation(
		() =>
			new Promise((_, reject) => {
				rejectDelivery = reject;
			}),
	);
	mount('signUp');
	let request!: Promise<void>;
	await act(async () => {
		request = submit(values);
	});
	expect(renderer.toJSON()).toBe('/confirm-email');
	await act(async () => {
		rejectDelivery(new Error('offline'));
		await request;
	});
	expect(renderer.toJSON()).toBe('/confirm-email');
	expect(showErrorNotification).toHaveBeenCalledTimes(1);
});

it('leaves failed login on account entry', async () => {
	jest.mocked(authActions.signIn).mockRejectedValue({
		code: 'auth/invalid-credential',
	});
	mount('signIn');
	await act(async () => submit(values));
	expect(renderer.toJSON()).toBeNull();
});

it('routes a verified login directly to Today', async () => {
	jest.mocked(authActions.signIn).mockImplementation(async () => {
		const verified = { ...account, isEmailConfirmed: true };
		onAccount(verified);
		return verified;
	});
	mount('signIn');
	await act(async () => submit(values));
	expect(renderer.toJSON()).toBe('/today');
});
