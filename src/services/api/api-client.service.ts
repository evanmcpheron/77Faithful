import { HTTP_METHOD } from '@turndown/library';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import type { IApiClientErrorParams } from './api-client.error';
import { ApiClientError } from './api-client.error';
import type {
	IApiClient,
	IApiClientConfig,
	IApiRequestConfig,
	IApiRequestOptions,
} from './api.types';

import type { IApiErrorResponse, TApiErrorDetails } from '@turndown/library';

const DefaultTimeoutMs = 15000;
export class ApiClientService implements IApiClient {
	private readonly axiosInstance: AxiosInstance;

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
				withCredentials: false,
			};
		}

		return {
			baseUrl: configOrBaseUrl.baseUrl,
			timeoutMs: configOrBaseUrl.timeoutMs ?? DefaultTimeoutMs,
			withCredentials: configOrBaseUrl.withCredentials ?? false,
		};
	};

	private setupInterceptors = (): void => {
		this.axiosInstance.interceptors.response.use(
			(response) => response,
			(error: unknown) => Promise.reject(this.normalizeError(error)),
		);
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
