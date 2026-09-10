import type {
	AxiosError,
	AxiosInstance,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from 'axios';
import axios, { AxiosHeaders } from 'axios';
import type { IApiClientErrorParams } from './api-client.error';
import { ApiClientError } from './api-client.error';
import type {
	IApiClient,
	IApiClientAuthConfig,
	IApiClientConfig,
	IApiRequestConfig,
	IApiRequestControlConfig,
	IApiRequestOptions,
} from './api.types';
import { HTTP_METHOD } from '@turndown/library';

import type { IApiErrorResponse, TApiErrorDetails } from '@turndown/library';

const DefaultTimeoutMs = 15000;
const UnauthorizedStatusCode = 401;

type TApiInternalRequestConfig<TBody = unknown> =
	InternalAxiosRequestConfig<TBody> & IApiRequestControlConfig;

export class ApiClientService implements IApiClient {
	private readonly axiosInstance: AxiosInstance;
	private authConfig: IApiClientAuthConfig | null = null;
	private refreshPromise: Promise<void> | null = null;

	constructor(config: IApiClientConfig);
	constructor(baseUrl: string);
	constructor(configOrBaseUrl: IApiClientConfig | string) {
		const config = this.normalizeConfig(configOrBaseUrl);

		this.axiosInstance = axios.create({
			baseURL: config.baseUrl,
			timeout: config.timeoutMs,
			withCredentials: config.withCredentials,
		});

		this.setupInterceptors();
	}

	configureAuth = (authConfig: IApiClientAuthConfig): void => {
		this.authConfig = authConfig;
	};

	request = async <TResponse, TBody = unknown>({
		path,
		body,
		method = HTTP_METHOD.GET,
		...config
	}: IApiRequestOptions<TBody>): Promise<TResponse> => {
		const response = await this.axiosInstance.request<TResponse>({
			...config,
			url: path,
			method,
			data: body,
		});

		return response.data;
	};

	get = async <TResponse>(
		path: string,
		config?: IApiRequestConfig,
	): Promise<TResponse> => {
		return this.request<TResponse>({
			...config,
			method: HTTP_METHOD.GET,
			path,
		});
	};

	post = async <TResponse, TBody = unknown>(
		path: string,
		body: TBody,
		config?: IApiRequestConfig<TBody>,
	): Promise<TResponse> => {
		return this.request<TResponse, TBody>({
			...config,
			method: HTTP_METHOD.POST,
			path,
			body,
		});
	};

	put = async <TResponse, TBody = unknown>(
		path: string,
		body: TBody,
		config?: IApiRequestConfig<TBody>,
	): Promise<TResponse> => {
		return this.request<TResponse, TBody>({
			...config,
			method: HTTP_METHOD.PUT,
			path,
			body,
		});
	};

	patch = async <TResponse, TBody = unknown>(
		path: string,
		body: TBody,
		config?: IApiRequestConfig<TBody>,
	): Promise<TResponse> => {
		return this.request<TResponse, TBody>({
			...config,
			method: HTTP_METHOD.PATCH,
			path,
			body,
		});
	};

	delete = async <TResponse>(
		path: string,
		config?: IApiRequestConfig,
	): Promise<TResponse> => {
		return this.request<TResponse>({
			...config,
			method: HTTP_METHOD.DELETE,
			path,
		});
	};

	private normalizeConfig = (
		configOrBaseUrl: IApiClientConfig | string,
	): Required<IApiClientConfig> => {
		if (typeof configOrBaseUrl === 'string') {
			return {
				baseUrl: configOrBaseUrl,
				timeoutMs: DefaultTimeoutMs,
				withCredentials: true,
			};
		}

		return {
			baseUrl: configOrBaseUrl.baseUrl,
			timeoutMs: configOrBaseUrl.timeoutMs ?? DefaultTimeoutMs,
			withCredentials: configOrBaseUrl.withCredentials ?? true,
		};
	};

	private setupInterceptors = (): void => {
		this.axiosInstance.interceptors.request.use(this.handleRequest);

		this.axiosInstance.interceptors.response.use(
			(response) => response,
			this.handleResponseError,
		);
	};

	private handleRequest = async <TBody = unknown>(
		config: InternalAxiosRequestConfig<TBody>,
	): Promise<InternalAxiosRequestConfig<TBody>> => {
		const requestConfig = config as TApiInternalRequestConfig<TBody>;

		if (requestConfig.skipAuth || this.authConfig === null) {
			return config;
		}

		const accessToken = await this.authConfig.getAccessToken();

		if (!accessToken) {
			return config;
		}

		const requestHeaders = AxiosHeaders.from(config.headers);
		requestHeaders.set('Authorization', `Bearer ${accessToken}`);

		config.headers = requestHeaders;

		return config;
	};

	private handleResponseError = async (
		error: AxiosError,
	): Promise<AxiosResponse> => {
		const originalRequest = error.config as
			| TApiInternalRequestConfig
			| undefined;

		if (!this.shouldRefreshSession(error, originalRequest)) {
			throw this.normalizeError(error);
		}

		try {
			await this.handleUnauthorizedRequest();
		} catch (refreshError) {
			await this.authConfig?.clearSession();

			throw this.normalizeError(refreshError);
		}

		if (originalRequest === undefined) {
			throw this.normalizeError(error);
		}

		originalRequest._retry = true;
		await this.attachAccessToken(originalRequest);

		return this.axiosInstance(originalRequest);
	};

	private shouldRefreshSession = (
		error: AxiosError,
		originalRequest: TApiInternalRequestConfig | undefined,
	): boolean => {
		if (this.authConfig === null) {
			return false;
		}

		if (originalRequest === undefined) {
			return false;
		}

		if (originalRequest._retry) {
			return false;
		}

		if (originalRequest.skipRefresh) {
			return false;
		}

		return error.response?.status === UnauthorizedStatusCode;
	};

	private handleUnauthorizedRequest = async (): Promise<void> => {
		if (this.authConfig === null) {
			throw new ApiClientError({
				message: 'Auth configuration is missing.',
			});
		}

		if (this.refreshPromise !== null) {
			return this.refreshPromise;
		}

		const refreshPromise = this.authConfig.refreshSession().finally(() => {
			this.refreshPromise = null;
		});

		this.refreshPromise = refreshPromise;

		return refreshPromise;
	};

	private attachAccessToken = async (
		config: TApiInternalRequestConfig,
	): Promise<void> => {
		const accessToken = await this.authConfig?.getAccessToken();

		if (!accessToken) {
			return;
		}

		const requestHeaders = AxiosHeaders.from(config.headers);
		requestHeaders.set('Authorization', `Bearer ${accessToken}`);

		config.headers = requestHeaders;
	};

	private normalizeError = (error: unknown): ApiClientError => {
		if (error instanceof ApiClientError) {
			return error;
		}

		if (!axios.isAxiosError(error)) {
			return new ApiClientError({
				message: 'An unknown API error occurred.',
			});
		}

		const responseData = this.getApiErrorResponse(error.response?.data);

		const errorParams: IApiClientErrorParams = {
			message: responseData?.error.message ?? error.message,
		};

		if (error.response?.status !== undefined) {
			errorParams.statusCode = error.response.status;
		}

		if (responseData?.error.code !== undefined) {
			errorParams.code = responseData.error.code;
		}

		if (responseData?.error.details !== undefined) {
			errorParams.details = responseData.error.details;
		}

		return new ApiClientError(errorParams);
	};

	private getApiErrorResponse = (
		value: unknown,
	): IApiErrorResponse<TApiErrorDetails> | null => {
		if (typeof value !== 'object' || value === null) {
			return null;
		}

		const response = value as Partial<IApiErrorResponse<TApiErrorDetails>>;

		return response.success === false && response.error !== undefined
			? (response as IApiErrorResponse<TApiErrorDetails>)
			: null;
	};
}
