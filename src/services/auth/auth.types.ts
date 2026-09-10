import type {
	IGetCurrentUserResponse,
	ILoginRequest,
	ILoginResponse,
	ILogoutRequest,
	ILogoutResponse,
	IRefreshSessionRequest,
	IRefreshSessionResponse,
	IRegisterRequest,
	IRegisterResponse,
	IStoredAuthSession,
	IUser,
} from '@turndown/library';

export type {
	IGetCurrentUserResponse,
	ILoginRequest,
	ILoginResponse,
	ILogoutRequest,
	ILogoutResponse,
	IRefreshSessionRequest,
	IRefreshSessionResponse,
	IRegisterRequest,
	IRegisterResponse,
	IStoredAuthSession,
};

export interface IAuthApiService {
	login: (request: ILoginRequest) => Promise<ILoginResponse>;
	register: (request: IRegisterRequest) => Promise<IRegisterResponse>;
	refreshSession: (
		request: IRefreshSessionRequest,
	) => Promise<IRefreshSessionResponse>;
	logout: (request?: ILogoutRequest) => Promise<ILogoutResponse>;
	getAuthenticatedUser: () => Promise<IUser>;
}
