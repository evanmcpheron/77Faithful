import { getAuth } from 'firebase-admin/auth';
import {
	HttpsError,
	onCall as firebaseOnCall,
	type CallableOptions,
	type CallableRequest,
} from 'firebase-functions/v2/https';

type TCommunityCallableHandler = (request: CallableRequest<unknown>) => unknown;

const requireCurrentAccount = async (
	request: CallableRequest<unknown>,
): Promise<void> => {
	// Existing handlers own unauthenticated and token-verification reason codes.
	if (!request.auth || request.auth.token.email_verified !== true) return;
	let user;
	try {
		user = await getAuth().getUser(request.auth.uid);
	} catch (caught) {
		if (
			caught &&
			typeof caught === 'object' &&
			'code' in caught &&
			caught.code === 'auth/user-not-found'
		)
			throw new HttpsError(
				'permission-denied',
				'This account is unavailable.',
				{ reason: 'AccountUnavailable' },
			);
		throw new HttpsError(
			'unavailable',
			'Account verification is temporarily unavailable.',
			{ reason: 'AccountUnavailable' },
		);
	}
	if (user.disabled || !user.emailVerified)
		throw new HttpsError(
			'permission-denied',
			'This account is unavailable.',
			{ reason: 'AccountUnavailable' },
		);
	const authenticatedAt = request.auth.token.auth_time;
	const validAfter = Date.parse(user.tokensValidAfterTime ?? '');
	if (
		typeof authenticatedAt !== 'number' ||
		!Number.isFinite(validAfter) ||
		authenticatedAt * 1000 < validAfter
	)
		throw new HttpsError(
			'permission-denied',
			'This sign-in session is unavailable.',
			{ reason: 'AccountUnavailable' },
		);
};

export const onCall = (
	optionsOrHandler: CallableOptions<unknown> | TCommunityCallableHandler,
	providedHandler?: TCommunityCallableHandler,
) => {
	const handler =
		typeof optionsOrHandler === 'function'
			? optionsOrHandler
			: providedHandler;
	if (!handler) throw new Error('A community callable handler is required.');
	const guarded = async (request: CallableRequest<unknown>) => {
		await requireCurrentAccount(request);
		return handler(request);
	};
	return typeof optionsOrHandler === 'function'
		? firebaseOnCall(guarded)
		: firebaseOnCall(optionsOrHandler, guarded);
};
