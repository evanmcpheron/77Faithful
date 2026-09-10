import * as SecureStore from 'expo-secure-store';

import type { IStoredAuthSession } from './auth.types';

const AuthSessionStorageKey = 'turndown.auth-session';

class AuthSessionService {
	private accessToken: string | null = null;
	private refreshToken: string | null = null;

	getAccessToken = (): string | null => {
		return this.accessToken;
	};

	getRefreshToken = (): string | null => {
		return this.refreshToken;
	};

	getSession = async (): Promise<IStoredAuthSession> => {
		const sessionString = await SecureStore.getItemAsync(
			AuthSessionStorageKey,
		);
		const session = this.parseStoredSession(sessionString);

		this.accessToken = session.accessToken;
		this.refreshToken = session.refreshToken;

		return session;
	};

	setSession = async (session: IStoredAuthSession): Promise<void> => {
		await SecureStore.setItemAsync(
			AuthSessionStorageKey,
			JSON.stringify(session),
		);

		this.accessToken = session.accessToken;
		this.refreshToken = session.refreshToken;
	};

	clearSession = async (): Promise<void> => {
		await SecureStore.deleteItemAsync(AuthSessionStorageKey);

		this.accessToken = null;
		this.refreshToken = null;
	};

	private parseStoredSession = (
		sessionString: string | null,
	): IStoredAuthSession => {
		if (sessionString === null) {
			return this.getEmptySession();
		}

		try {
			const session = JSON.parse(
				sessionString,
			) as Partial<IStoredAuthSession>;

			return {
				accessToken: session.accessToken ?? null,
				refreshToken: session.refreshToken ?? null,
				expiresAt: session.expiresAt ?? null,
			};
		} catch {
			return this.getEmptySession();
		}
	};

	private getEmptySession = (): IStoredAuthSession => ({
		accessToken: null,
		refreshToken: null,
		expiresAt: null,
	});
}

export const authSessionService = new AuthSessionService();
