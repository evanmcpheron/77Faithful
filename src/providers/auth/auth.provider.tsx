import { useCallback, useEffect, useMemo, useState } from 'react';

import { configureApiClientAuth } from '@td/services/api/api-client.instance';
import { authApiService } from '@td/services/auth/auth-api.service';
import { authSessionService } from '@td/services/auth/auth-session.service';

import { AuthContext } from './auth.context';
import {
	AuthStatus,
	type IRegisterRequest,
	type IAuthProviderProps,
	type IAuthProviderValue,
	type ILoginCredentials,
	type ISetAuthSessionParams,
	type TAuthStatus,
} from './auth.types';

export const AuthProvider = ({ children }: IAuthProviderProps) => {
	const [user, setUser] = useState<IAuthProviderValue['user']>(null);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [status, setStatus] = useState<TAuthStatus>(AuthStatus.Initializing);

	const setSession = useCallback(async (session: ISetAuthSessionParams) => {
		setUser(session.user);
		setAccessToken(session.accessToken);
		setStatus(AuthStatus.Authenticated);

		await authSessionService.setSession({
			accessToken: session.accessToken,
			refreshToken: session.refreshToken,
			expiresAt: session.expiresAt ?? null,
		});
	}, []);

	const clearSession = useCallback(() => {
		setUser(null);
		setAccessToken(null);
		setStatus(AuthStatus.Unauthenticated);

		authSessionService.clearSession();
	}, []);

	const refreshSession = useCallback(async () => {
		const currentRefreshToken = authSessionService.getRefreshToken();

		if (currentRefreshToken) {
			try {
				const response = await authApiService.refreshSession({
					refreshToken: currentRefreshToken,
				});

				await setSession({
					user: response.user ?? null,
					accessToken: response.accessToken,
					refreshToken: response.refreshToken,
					expiresAt: response.expiresAt,
				});
				return;
			} catch {
				// refresh failed — fall through to clear
			}
		}

		clearSession();
		setStatus(AuthStatus.SessionExpired);
	}, [clearSession, setSession]);

	const login = useCallback(
		async (credentials: ILoginCredentials): Promise<string | undefined> => {
			const response = await authApiService.login({
				email: credentials.email,
				password: credentials.password,
			});
			const { user, accessToken, refreshToken, expiresAt } = response;

			await setSession({
				user,
				accessToken,
				refreshToken,
				expiresAt,
			});

			return user?.companyId ?? undefined;
		},
		[setSession],
	);

	const register = useCallback(async (credentials: IRegisterRequest) => {
		const response = await authApiService.register(credentials);

		const { accessToken, refreshToken, user, expiresAt } = response;

		await setSession({
			accessToken,
			refreshToken,
			user,
			expiresAt: expiresAt ?? null,
		});
	}, [setSession]);

	const logout = useCallback(async () => {
		const refreshToken = authSessionService.getRefreshToken();

		await authApiService.logout(
			refreshToken ? { refreshToken } : undefined,
		);

		clearSession();
	}, [clearSession]);

	useEffect(() => {
		configureApiClientAuth({
			getAccessToken: () => authSessionService.getAccessToken(),
			refreshSession,
			setSession,
			clearSession,
		});
	}, [clearSession, refreshSession, setSession]);

	useEffect(() => {
		const initializeSession = async () => {
			const session = await authSessionService.getSession();
			if (session.accessToken) {
				try {
					const authenticatedUser =
						await authApiService.getAuthenticatedUser();
					setUser(authenticatedUser);
					setAccessToken(session.accessToken);
					setStatus(AuthStatus.Authenticated);
				} catch {
					clearSession();
				}
			} else {
				setStatus(AuthStatus.Unauthenticated);
			}
		};
		void initializeSession();
	}, []);

	const value = useMemo<IAuthProviderValue>(
		() => ({
			user,
			accessToken,
			status,
			isAuthenticated: user !== null && accessToken !== null,
			isInitializingSession: status === AuthStatus.Initializing,
			isRefreshingSession: status === AuthStatus.Refreshing,
			login,
			register,
			logout,
			refreshSession,
			setSession,
			clearSession,
		}),
		[
			accessToken,
			user,
			clearSession,
			refreshSession,
			setSession,
			login,
			register,
			logout,
			status,
		],
	);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};
