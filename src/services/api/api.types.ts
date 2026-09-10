import type { AxiosRequestConfig } from 'axios';

import type { IApiSuccessResponse, THttpMethod } from '@turndown/library';

export interface IApiRequestOptions<
	TBody = unknown,
> extends AxiosRequestConfig<TBody> {
	method?: THttpMethod;
	path: string;
	body?: TBody;
}

export type IApiRequestConfig<TBody = unknown> = AxiosRequestConfig<TBody>;

export interface IApiClientConfig {
	baseUrl: string;
	timeoutMs?: number;
	withCredentials?: boolean;
}

export interface IApiClient {
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
