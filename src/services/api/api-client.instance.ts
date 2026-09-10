import { ApiClientService } from './api-client.service';
import type { IApiClientAuthConfig } from './api.types';

const apiBaseUrl = process.env.EXPO_PUBLIC_BASE_URL;

if (!apiBaseUrl) {
	throw new Error('EXPO_PUBLIC_BASE_URL is required.');
}

export const apiClient = new ApiClientService({
	baseUrl: apiBaseUrl,
	withCredentials: true,
});

export const configureApiClientAuth = (
	authConfig: IApiClientAuthConfig,
): void => {
	apiClient.configureAuth(authConfig);
};
