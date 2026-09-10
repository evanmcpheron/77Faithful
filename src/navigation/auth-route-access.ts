import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';

export const getAuthRouteRedirect = (
	account: IAuthenticatedAccountIdentity | null,
	pathname: string,
	isProfileReady: boolean,
): '/' | '/confirm-email' | '/today' | null => {
	if (account?.isEmailConfirmed && isProfileReady) return '/today';

	const isVerificationRoute =
		pathname === '/confirm-email' || pathname === '/otp';
	if (!account) return isVerificationRoute ? '/' : null;
	return isVerificationRoute ? null : '/confirm-email';
};
