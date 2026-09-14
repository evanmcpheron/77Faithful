import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';

export const getAuthRouteRedirect = (
	account: IAuthenticatedAccountIdentity | null,
	pathname: string,
	isProfileReady: boolean,
	hasJourney: boolean,
	hasPendingCommunityInvitation = false,
):
	| '/'
	| '/confirm-email'
	| '/onboarding'
	| '/today'
	| '/communities/join'
	| null => {
	if (account?.isEmailConfirmed && isProfileReady) {
		if (hasPendingCommunityInvitation) return '/communities/join';
		return hasJourney ? '/today' : '/onboarding';
	}

	const isVerificationRoute =
		pathname === '/confirm-email' || pathname === '/otp';
	if (!account) return isVerificationRoute ? '/' : null;
	return isVerificationRoute ? null : '/confirm-email';
};
