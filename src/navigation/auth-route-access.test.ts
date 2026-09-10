import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';
import { getAuthRouteRedirect } from './auth-route-access';

const unverified: IAuthenticatedAccountIdentity = {
	userId: 'account-1',
	contactEmail: 'reader@example.com',
	isEmailConfirmed: false,
};
const verified = { ...unverified, isEmailConfirmed: true };

it.each([
	'/',
	'/register',
	'/forgot-password',
	'/recover-access',
	'/reset-password',
])('allows guests on %s and redirects signed-in accounts', (pathname) => {
	expect(getAuthRouteRedirect(null, pathname)).toBeNull();
	expect(getAuthRouteRedirect(unverified, pathname)).toBe('/confirm-email');
	expect(getAuthRouteRedirect(verified, pathname)).toBe('/today');
});

it.each(['/confirm-email', '/otp'])(
	'only allows unverified accounts on %s',
	(pathname) => {
		expect(getAuthRouteRedirect(null, pathname)).toBe('/');
		expect(getAuthRouteRedirect(unverified, pathname)).toBeNull();
		expect(getAuthRouteRedirect(verified, pathname)).toBe('/today');
	},
);
