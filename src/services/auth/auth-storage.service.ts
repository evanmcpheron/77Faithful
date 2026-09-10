import type { IStoredAuthSession } from './auth.types';

class AuthStorageService {
	getStoredSession = async (): Promise<IStoredAuthSession | null> => {
		// TODO:
		// Browser option:
		// - Avoid storing refresh tokens in localStorage.
		// - You may store only non-sensitive metadata if needed.
		// - Prefer memory-only access token + HTTP-only refresh cookie.

		throw new Error('getStoredSession has not been implemented.');
	};

	setStoredSession = async (session: IStoredAuthSession): Promise<void> => {
		// TODO:
		// Store only what is appropriate for the platform.
		// Do not store browser refresh tokens in localStorage.

		void session;

		throw new Error('setStoredSession has not been implemented.');
	};

	clearStoredSession = async (): Promise<void> => {
		// TODO:
		// Clear client-readable session metadata.

		throw new Error('clearStoredSession has not been implemented.');
	};
}

export const authStorageService = new AuthStorageService();
