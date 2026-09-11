import type { TApiErrorDetails, TErrorCode } from '@turndown/library';

export interface IApiClientErrorParams {
	message: string;
	statusCode?: number;
	code?: TErrorCode;
	details?: TApiErrorDetails;
}

export class ApiClientError extends Error {
	public readonly statusCode: number | undefined;
	public readonly code: TErrorCode | undefined;
	public readonly details: TApiErrorDetails | undefined;

	constructor({ message, statusCode, code, details }: IApiClientErrorParams) {
		super(message);

		this.name = 'ApiClientError';
		this.statusCode = statusCode;
		this.code = code;
		this.details = details;
	}
}
