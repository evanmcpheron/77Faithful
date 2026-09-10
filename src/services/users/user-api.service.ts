import type {
	IDeleteUserResponse,
	IGetCurrentUserResponse,
	IGetUserByIdResponse,
	IUpdateCurrentUserRequest,
	IUpdateUserResponse,
} from '@turndown/library';

import { apiClient } from '../api/api-client.instance';
import type { TApiResponse } from '../api/api.types';
import type { IUserApiService } from './user.types';

class UserApiService implements IUserApiService {
	getCurrentUser = async (): Promise<IGetCurrentUserResponse> => {
		const response =
			await apiClient.get<TApiResponse<IGetCurrentUserResponse>>(
				'/users/me',
			);

		return response.data;
	};

	updateCurrentUser = async (
		request: IUpdateCurrentUserRequest,
	): Promise<IUpdateUserResponse> => {
		const response = await apiClient.patch<
			TApiResponse<IUpdateUserResponse>,
			IUpdateCurrentUserRequest
		>('/users/me', request);

		return response.data;
	};

	getUserById = async (userId: string): Promise<IGetUserByIdResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetUserByIdResponse>
		>(`/users/${userId}`);

		return response.data;
	};

	deleteCurrentUser = async (): Promise<IDeleteUserResponse> => {
		const response =
			await apiClient.delete<TApiResponse<IDeleteUserResponse>>(
				'/users/me',
			);

		return response.data;
	};
}

export const userApiService = new UserApiService();
