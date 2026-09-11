import type { IRegisterFormValues } from '../forms/register/register.form.types';

export const validateAuthValues = (
	values: Partial<IRegisterFormValues>,
	mode: 'signIn' | 'signUp',
): string | null => {
	if (
		!values.email?.trim() ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
	)
		return 'Enter a valid email address.';
	if (!values.password) return 'Enter your password.';
	if (mode === 'signUp') {
		if ((values.preferredName?.trim().length ?? 0) > 80)
			return 'Use a preferred name with no more than 80 characters.';
		if (values.password.length < 6)
			return 'Choose a password with at least 6 characters.';
		if (values.password !== values.confirmPassword)
			return 'Your passwords do not match.';
		if (!values.termsAccepted)
			return 'Accept the terms of use to create your account.';
	}
	return null;
};

export const getAuthErrorMessage = (error: unknown): string => {
	const code =
		typeof error === 'object' && error !== null && 'code' in error
			? error.code
			: null;
	switch (code) {
		case 'auth/invalid-email':
			return 'Enter a valid email address.';
		case 'auth/invalid-credential':
		case 'auth/user-not-found':
		case 'auth/wrong-password':
			return 'The email or password is incorrect. Please try again.';
		case 'auth/email-already-in-use':
			return 'An account already uses this email. Sign in or reset your password.';
		case 'auth/weak-password':
		case 'auth/password-does-not-meet-requirements':
			return 'Choose a stronger password and try again.';
		case 'auth/network-request-failed':
			return 'Check your internet connection and try again.';
		case 'auth/too-many-requests':
			return 'Too many attempts. Please wait a moment and try again.';
		case 'auth/user-disabled':
			return 'This account is disabled. Please contact support.';
		default:
			return 'We could not complete your request. Please try again.';
	}
};
