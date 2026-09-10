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
	IUser,
} from '@turndown/library';

import { apiClient } from '../api/api-client.instance';
import type { TApiResponse } from '../api/api.types';
import type { IAuthApiService } from './auth.types';

class AuthApiService implements IAuthApiService {
	login = async (request: ILoginRequest): Promise<ILoginResponse> => {
		const response = await apiClient.post<
			TApiResponse<ILoginResponse>,
			ILoginRequest
		>('/auth/login', request, { skipRefresh: true, skipAuth: true });

		return response.data;
	};

	register = async (
		request: IRegisterRequest,
	): Promise<IRegisterResponse> => {
		const response = await apiClient.post<
			TApiResponse<IRegisterResponse>,
			IRegisterRequest
		>('/auth/register', request, { skipRefresh: true, skipAuth: true });

		return response.data;
	};

	refreshSession = async (
		request: IRefreshSessionRequest,
	): Promise<IRefreshSessionResponse> => {
		const response = await apiClient.post<
			TApiResponse<IRefreshSessionResponse>,
			IRefreshSessionRequest
		>('/auth/refresh', request, {
			skipAuth: true,
			skipRefresh: true,
		});

		return response.data;
	};

	logout = async (request: ILogoutRequest = {}): Promise<ILogoutResponse> => {
		const response = await apiClient.post<
			TApiResponse<ILogoutResponse>,
			ILogoutRequest
		>('/auth/logout', request);

		return response.data;
	};

	getAuthenticatedUser = async (): Promise<IUser> => {
		const response =
			await apiClient.get<TApiResponse<IGetCurrentUserResponse>>(
				'/users/me',
			);

		if (!response.data.user) {
			throw new Error('Authenticated user not found.');
		}

		return response.data.user;
	};
}

export const authApiService = new AuthApiService();
