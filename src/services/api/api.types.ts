import type { AxiosRequestConfig } from 'axios';

import type {
	IApiSuccessResponse,
	ISetAuthSessionParams,
	THttpMethod,
} from '@turndown/library';

export interface IApiRequestControlConfig {
	/**
	 * Skips attaching the access token for public endpoints.
	 */
	skipAuth?: boolean;

	/**
	 * Skips refresh/retry behavior. Use this for /auth/refresh.
	 */
	skipRefresh?: boolean;

	/**
	 * Internal guard to prevent infinite unauthorized retry loops.
	 */
	_retry?: boolean;
}

export interface IApiRequestOptions<TBody = unknown>
	extends AxiosRequestConfig<TBody>,
		IApiRequestControlConfig {
	method?: THttpMethod;
	path: string;
	body?: TBody;
}

export interface IApiRequestConfig<TBody = unknown>
	extends AxiosRequestConfig<TBody>,
		IApiRequestControlConfig {}

export interface IApiClientAuthConfig {
	getAccessToken: () => string | null | Promise<string | null>;
	refreshSession: () => Promise<void>;
	setSession: (session: ISetAuthSessionParams) => void;
	clearSession: () => void | Promise<void>;
}

export interface IApiClientConfig {
	baseUrl: string;
	timeoutMs?: number;
	withCredentials?: boolean;
}

export interface IApiClient {
	configureAuth: (authConfig: IApiClientAuthConfig) => void;

	request: <TResponse, TBody = unknown>(
		options: IApiRequestOptions<TBody>,
	) => Promise<TResponse>;

	get: <TResponse>(
		path: string,
		config?: IApiRequestConfig,
	) => Promise<TResponse>;

	post: <TResponse, TBody = unknown>(
		path: string,
		body: TBody,
		config?: IApiRequestConfig<TBody>,
	) => Promise<TResponse>;

	put: <TResponse, TBody = unknown>(
		path: string,
		body: TBody,
		config?: IApiRequestConfig<TBody>,
	) => Promise<TResponse>;

	patch: <TResponse, TBody = unknown>(
		path: string,
		body: TBody,
		config?: IApiRequestConfig<TBody>,
	) => Promise<TResponse>;

	delete: <TResponse>(
		path: string,
		config?: IApiRequestConfig,
	) => Promise<TResponse>;
}

export type TApiResponse<TData> = IApiSuccessResponse<TData>;
