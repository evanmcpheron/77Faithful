import type { ReactNode } from 'react';

import {
	AUTH_STATUS as AuthStatus,
	type IAuthSession,
	type ILoginCredentials,
	type IRegisterRequest,
	type ISetAuthSessionParams,
	type IStoredAuthSession,
	type IUser,
	type TAuthStatus,
} from '@turndown/library';

export { AuthStatus };
export type {
	IAuthSession,
	IStoredAuthSession as IAuthTokens,
	ILoginCredentials,
	IRegisterRequest,
	ISetAuthSessionParams,
	IStoredAuthSession,
	TAuthStatus,
};

export interface IAuthProviderProps {
	children: ReactNode;
}

export interface IAuthProviderValue {
	user: IUser | null;
	accessToken: string | null;
	status: TAuthStatus;
	isAuthenticated: boolean;
	isInitializingSession: boolean;
	isRefreshingSession: boolean;
	login: (credentials: ILoginCredentials) => Promise<string | undefined>;
	register: (credentials: IRegisterRequest) => Promise<void>;
	logout: () => Promise<void>;
	refreshSession: () => Promise<void>;
	setSession: (session: ISetAuthSessionParams) => void;
	clearSession: () => void;
}
