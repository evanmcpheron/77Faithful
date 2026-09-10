import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';

export const getAuthRouteRedirect = (
	account: IAuthenticatedAccountIdentity | null,
	pathname: string,
	isProfileReady: boolean,
	hasJourney: boolean,
): '/' | '/confirm-email' | '/onboarding' | '/today' | null => {
	if (account?.isEmailConfirmed && isProfileReady)
		return hasJourney ? '/today' : '/onboarding';

	const isVerificationRoute =
		pathname === '/confirm-email' || pathname === '/otp';
	if (!account) return isVerificationRoute ? '/' : null;
	return isVerificationRoute ? null : '/confirm-email';
};
