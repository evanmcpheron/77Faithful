import type {
	IDeleteUserResponse,
	IGetCurrentUserResponse,
	IGetUserByIdResponse,
	IUpdateCurrentUserRequest,
	IUpdateUserResponse,
} from '@turndown/library';

export interface IUserApiService {
	getCurrentUser: () => Promise<IGetCurrentUserResponse>;
	updateCurrentUser: (
		request: IUpdateCurrentUserRequest,
	) => Promise<IUpdateUserResponse>;
	getUserById: (userId: string) => Promise<IGetUserByIdResponse>;
	deleteCurrentUser: () => Promise<IDeleteUserResponse>;
}
