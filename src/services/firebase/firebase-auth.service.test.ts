import { FirebaseError } from 'firebase/app';
import {
	ActionCodeOperation,
	applyActionCode,
	checkActionCode,
	createUserWithEmailAndPassword,
	getIdToken,
	reload,
	sendEmailVerification,
	signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from './firebase-auth.instance';
import { authActions } from './firebase-auth.service';

jest.mock('./firebase-auth.instance', () => ({
	auth: {
		currentUser: null,
		authStateReady: jest.fn().mockResolvedValue(undefined),
	},
}));
jest.mock('firebase/auth', () => ({
	...jest.requireActual('firebase/auth'),
	createUserWithEmailAndPassword: jest.fn(),
	signInWithEmailAndPassword: jest.fn(),
	sendEmailVerification: jest.fn(),
	checkActionCode: jest.fn(),
	applyActionCode: jest.fn(),
	reload: jest.fn(),
	getIdToken: jest.fn(),
}));

const user = {
	uid: 'account-1',
	email: 'reader@example.com',
	emailVerified: false,
	refreshToken: 'private-token',
};
const setCurrentUser = (value: typeof user | null) =>
	Object.defineProperty(auth, 'currentUser', { value, configurable: true });

beforeEach(() => {
	jest.clearAllMocks();
	setCurrentUser(null);
});

it.each(['signUp', 'signIn'] as const)(
	'%s exposes only the shared identity and preserves password whitespace',
	async (operation) => {
		const sdkMethod =
			operation === 'signUp'
				? createUserWithEmailAndPassword
				: signInWithEmailAndPassword;
		jest.mocked(sdkMethod).mockResolvedValue({ user } as Awaited<
			ReturnType<typeof sdkMethod>
		>);
		await expect(
			authActions[operation]({
				email: ' reader@example.com ',
				password: ' password ',
			}),
		).resolves.toEqual({
			userId: 'account-1',
			contactEmail: 'reader@example.com',
			isEmailConfirmed: false,
		});
		expect(sdkMethod).toHaveBeenCalledWith(
			auth,
			'reader@example.com',
			' password ',
		);
		expect(sendEmailVerification).not.toHaveBeenCalled();
	},
);

it('preserves sign-in error codes for the caller', async () => {
	const error = new FirebaseError(
		'auth/invalid-credential',
		'Invalid credential',
	);
	jest.mocked(signInWithEmailAndPassword).mockRejectedValue(error);
	await expect(
		authActions.signIn({ email: user.email, password: 'wrong' }),
	).rejects.toBe(error);
});

it('requires a session before sending verification or changing credentials', async () => {
	await expect(authActions.sendEmailVerification()).rejects.toMatchObject({
		code: 'auth/user-required',
	});
	await expect(
		authActions.changePassword('new-password'),
	).rejects.toMatchObject({ code: 'auth/user-required' });
	await expect(
		authActions.requestEmailChange('new@example.com'),
	).rejects.toMatchObject({ code: 'auth/user-required' });
});

it('allows verification delivery to be retried without creating another account', async () => {
	setCurrentUser(user);
	jest.mocked(sendEmailVerification)
		.mockRejectedValueOnce(new Error('offline'))
		.mockResolvedValueOnce();
	await expect(authActions.sendEmailVerification()).rejects.toThrow(
		'offline',
	);
	await authActions.sendEmailVerification();
	expect(sendEmailVerification).toHaveBeenCalledTimes(2);
	expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
});

it('does not send another verification message for a confirmed email', async () => {
	setCurrentUser({ ...user, emailVerified: true });
	await authActions.sendEmailVerification();
	expect(sendEmailVerification).not.toHaveBeenCalled();
});

it('rejects password-reset codes passed to email confirmation', async () => {
	jest.mocked(checkActionCode).mockResolvedValue({
		operation: ActionCodeOperation.PASSWORD_RESET,
		data: {},
	});
	await expect(
		authActions.confirmEmailVerification('reset-code'),
	).rejects.toMatchObject({ code: 'auth/invalid-action-code' });
	expect(applyActionCode).not.toHaveBeenCalled();
});

it('applies email verification while signed out without requiring a session', async () => {
	jest.mocked(checkActionCode).mockResolvedValue({
		operation: ActionCodeOperation.VERIFY_EMAIL,
		data: {},
	});
	await authActions.confirmEmailVerification('verification-code');
	expect(applyActionCode).toHaveBeenCalledWith(auth, 'verification-code');
});

it('reloads email confirmation and refreshes authorization claims', async () => {
	const confirmedUser = { ...user };
	setCurrentUser(confirmedUser);
	jest.mocked(reload).mockImplementationOnce(async () => {
		confirmedUser.emailVerified = true;
	});
	await expect(authActions.refreshAccount()).resolves.toMatchObject({
		isEmailConfirmed: true,
	});
	expect(getIdToken).toHaveBeenCalledWith(confirmedUser, true);
});

it('does not return a stale identity after sign-out during refresh', async () => {
	setCurrentUser(user);
	jest.mocked(reload).mockImplementationOnce(async () => {
		setCurrentUser(null);
	});
	await expect(authActions.refreshAccount()).resolves.toBeNull();
});
