import type { IAuthActions } from '@td/providers/auth/auth.types';
import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';
import { FirebaseError } from 'firebase/app';
import {
	ActionCodeOperation,
	applyActionCode,
	checkActionCode,
	confirmPasswordReset,
	createUserWithEmailAndPassword,
	EmailAuthProvider,
	getIdToken,
	onIdTokenChanged,
	reauthenticateWithCredential,
	reload,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut,
	updatePassword,
	verifyBeforeUpdateEmail,
	verifyPasswordResetCode,
	type User,
} from 'firebase/auth';
import { auth } from './firebase-auth.instance';

const toAccountIdentity = (user: User): IAuthenticatedAccountIdentity => ({
	userId: user.uid,
	contactEmail: user.email,
	isEmailConfirmed: user.emailVerified,
});

const requireUser = () => {
	if (!auth.currentUser) {
		throw new FirebaseError(
			'auth/user-required',
			'An authenticated account is required.',
		);
	}
	return auth.currentUser;
};

export const subscribeToAccount = (
	onChange: (account: IAuthenticatedAccountIdentity | null) => void,
	onError: (error: Error) => void,
) =>
	onIdTokenChanged(
		auth,
		(user) => onChange(user ? toAccountIdentity(user) : null),
		onError,
	);

const refreshAccount =
	async (): Promise<IAuthenticatedAccountIdentity | null> => {
		await auth.authStateReady();
		const user = auth.currentUser;
		if (!user) return null;
		await reload(user);
		// Refresh email_verified in the token used by Firestore and notify the provider.
		await getIdToken(user, true);
		return auth.currentUser === user ? toAccountIdentity(user) : null;
	};

/** SDK failures reject with auth/* codes; callers should translate them into appropriate UI copy. */
export const authActions: IAuthActions = {
	signUp: async ({ email, password }) => {
		const { user } = await createUserWithEmailAndPassword(
			auth,
			email.trim(),
			password,
		);
		return toAccountIdentity(user);
	},
	signIn: async ({ email, password }) => {
		const { user } = await signInWithEmailAndPassword(
			auth,
			email.trim(),
			password,
		);
		return toAccountIdentity(user);
	},
	signOut: () => signOut(auth),
	sendEmailVerification: async () => {
		const user = requireUser();
		if (!user.emailVerified) await sendEmailVerification(user);
	},
	confirmEmailVerification: async (code) => {
		const action = await checkActionCode(auth, code);
		if (
			action.operation !== ActionCodeOperation.VERIFY_EMAIL &&
			action.operation !== ActionCodeOperation.VERIFY_AND_CHANGE_EMAIL
		) {
			throw new FirebaseError(
				'auth/invalid-action-code',
				'An email verification code is required.',
			);
		}
		await applyActionCode(auth, code);
		await refreshAccount();
	},
	refreshAccount,
	sendPasswordResetEmail: (email) =>
		sendPasswordResetEmail(auth, email.trim()),
	verifyPasswordResetCode: (code) => verifyPasswordResetCode(auth, code),
	confirmPasswordReset: (code, newPassword) =>
		confirmPasswordReset(auth, code, newPassword),
	reauthenticate: async (password) => {
		const user = requireUser();
		if (!user.email)
			throw new FirebaseError(
				'auth/email-required',
				'An email account is required.',
			);
		await reauthenticateWithCredential(
			user,
			EmailAuthProvider.credential(user.email, password),
		);
	},
	changePassword: async (newPassword) =>
		updatePassword(requireUser(), newPassword),
	requestEmailChange: async (newEmail) =>
		verifyBeforeUpdateEmail(requireUser(), newEmail.trim()),
	getIdToken: async (forceRefresh = false) => {
		await auth.authStateReady();
		return auth.currentUser
			? getIdToken(auth.currentUser, forceRefresh)
			: null;
	},
};
