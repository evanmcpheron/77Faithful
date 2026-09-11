import { showErrorNotification } from '@td/components/ui/notification/notification.helper';
import { useAuth } from '@td/providers/auth/auth.hook';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useAuthActions } from './use-auth-actions.hook';

jest.mock('@td/providers/auth/auth.hook');
jest.mock('@td/components/ui/notification/notification.helper', () => ({
	showErrorNotification: jest.fn(),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const signIn = jest.fn();
const signUp = jest.fn();
const sendEmailVerification = jest.fn();
let current: ReturnType<typeof useAuthActions>;
let renderer: ReactTestRenderer;
const values = {
	email: ' reader@example.com ',
	password: 'secret123',
	confirmPassword: 'secret123',
	termsAccepted: true,
};
const mount = (mode: 'signIn' | 'signUp') => {
	const Consumer = () => {
		current = useAuthActions(mode);
		return null;
	};
	act(() => {
		renderer = create(createElement(Consumer));
	});
};
beforeEach(() => {
	jest.resetAllMocks();
	jest.mocked(useAuth).mockReturnValue({
		signIn,
		signUp,
		sendEmailVerification,
	} as unknown as ReturnType<typeof useAuth>);
});
afterEach(() => act(() => renderer.unmount()));
it('signs in with trimmed email and unchanged password', async () => {
	mount('signIn');
	await act(async () => {
		await current.submit(values);
	});
	expect(signIn).toHaveBeenCalledWith({
		email: 'reader@example.com',
		password: 'secret123',
	});
	expect(signUp).not.toHaveBeenCalled();
});
it('rejects mismatched passwords before creating an account', async () => {
	mount('signUp');
	await act(async () => {
		await current.submit({ ...values, confirmPassword: 'different' });
	});
	expect(signUp).not.toHaveBeenCalled();
	expect(current.error).toBe('Your passwords do not match.');
});
it('keeps a successful signup when verification delivery fails', async () => {
	sendEmailVerification.mockRejectedValue(new Error('offline'));
	mount('signUp');
	await act(async () => {
		await current.submit(values);
	});
	expect(signUp).toHaveBeenCalledTimes(1);
	expect(sendEmailVerification).toHaveBeenCalledTimes(1);
	expect(showErrorNotification).toHaveBeenCalled();
	expect(current.error).toBeNull();
});
it('blocks duplicate submissions and allows retry after an auth failure', async () => {
	let rejectRequest!: (error: unknown) => void;
	signIn.mockImplementationOnce(
		() =>
			new Promise((_, reject) => {
				rejectRequest = reject;
			}),
	);
	mount('signIn');
	let request!: Promise<void>;
	act(() => {
		request = current.submit(values);
	});
	expect(current.isSubmitting).toBe(true);
	await act(async () => {
		await current.submit(values);
	});
	expect(signIn).toHaveBeenCalledTimes(1);
	await act(async () => {
		rejectRequest({ code: 'auth/invalid-credential' });
		await request;
	});
	expect(current.isSubmitting).toBe(false);
	expect(current.error).toContain('email or password is incorrect');
	await act(async () => {
		await current.submit(values);
	});
	expect(signIn).toHaveBeenCalledTimes(2);
	expect(current.error).toBeNull();
});

it('passes the optional preferred name to signup', async () => {
	mount('signUp');
	await act(async () =>
		current.submit({ ...values, preferredName: '  Reader  ' }),
	);
	expect(signUp).toHaveBeenCalledWith({
		email: 'reader@example.com',
		password: values.password,
		preferredName: 'Reader',
	});
});
it('rejects oversized names before creating an account', async () => {
	mount('signUp');
	await act(async () =>
		current.submit({ ...values, preferredName: 'x'.repeat(81) }),
	);
	expect(signUp).not.toHaveBeenCalled();
	expect(current.error).toContain('80 characters');
});
