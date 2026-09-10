import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';

export const getAuthRouteRedirect = (
	account: IAuthenticatedAccountIdentity | null,
	pathname: string,
): '/' | '/confirm-email' | '/today' | null => {
	if (account?.isEmailConfirmed) return '/today';

	const isVerificationRoute =
		pathname === '/confirm-email' || pathname === '/otp';
	if (!account) return isVerificationRoute ? '/' : null;
	return isVerificationRoute ? null : '/confirm-email';
};
