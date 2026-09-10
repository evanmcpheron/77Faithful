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
	expect(getAuthRouteRedirect(null, pathname, false)).toBeNull();
	expect(getAuthRouteRedirect(unverified, pathname, true)).toBe(
		'/confirm-email',
	);
	expect(getAuthRouteRedirect(verified, pathname, true)).toBe('/today');
});

it.each(['/confirm-email', '/otp'])(
	'only allows unverified accounts on %s',
	(pathname) => {
		expect(getAuthRouteRedirect(null, pathname, false)).toBe('/');
		expect(getAuthRouteRedirect(unverified, pathname, true)).toBeNull();
		expect(getAuthRouteRedirect(verified, pathname, true)).toBe('/today');
	},
);

it.each(['/', '/register', '/today'])(
	'keeps a verified account without a saved profile on confirmation from %s',
	(pathname) => {
		expect(getAuthRouteRedirect(verified, pathname, false)).toBe(
			'/confirm-email',
		);
	},
);
it('allows a verified account to retry profile creation on confirmation', () => {
	expect(getAuthRouteRedirect(verified, '/otp', false)).toBeNull();
});
