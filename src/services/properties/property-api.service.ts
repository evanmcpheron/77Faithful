import type {
	ICreatePropertyRequest,
	ICreatePropertyResponse,
	IDeletePropertyResponse,
	IGetPropertiesByCompanyIdResponse,
	IGetPropertiesRequest,
	IGetPropertiesResponse,
	IGetPropertyAccessInformationResponse,
	IGetPropertyByIdResponse,
	IUpdatePropertyAccessInformationRequest,
	IUpdatePropertyAccessInformationResponse,
	IUpdatePropertyRequest,
	IUpdatePropertyResponse,
} from '@turndown/library';

import { apiClient } from '../api/api-client.instance';
import type { IApiRequestConfig, TApiResponse } from '../api/api.types';
import type { IPropertyApiService } from './property.types';

class PropertyApiService implements IPropertyApiService {
	getProperties = async (
		request?: IGetPropertiesRequest,
	): Promise<IGetPropertiesResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetPropertiesResponse>
		>('/properties', this.getPropertiesQueryConfig(request));

		return response.data;
	};

	getCompanyProperties =
		async (): Promise<IGetPropertiesByCompanyIdResponse> => {
			const response =
				await apiClient.get<
					TApiResponse<IGetPropertiesByCompanyIdResponse>
				>('/properties/me');

			return response.data;
		};

	getPropertyById = async (
		propertyId: string,
	): Promise<IGetPropertyByIdResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetPropertyByIdResponse>
		>(`/properties/${propertyId}`);

		return response.data;
	};

	createProperty = async (
		request: ICreatePropertyRequest,
	): Promise<ICreatePropertyResponse> => {
		const response = await apiClient.post<
			TApiResponse<ICreatePropertyResponse>,
			ICreatePropertyRequest
		>('/properties', request);

		return response.data;
	};

	updateProperty = async (
		propertyId: string,
		request: IUpdatePropertyRequest,
	): Promise<IUpdatePropertyResponse> => {
		const response = await apiClient.patch<
			TApiResponse<IUpdatePropertyResponse>,
			IUpdatePropertyRequest
		>(`/properties/${propertyId}`, request);

		return response.data;
	};

	deleteProperty = async (
		propertyId: string,
	): Promise<IDeletePropertyResponse> => {
		const response = await apiClient.delete<
			TApiResponse<IDeletePropertyResponse>
		>(`/properties/${propertyId}`);

		return response.data;
	};

	getPropertyAccessInformation = async (
		propertyId: string,
	): Promise<IGetPropertyAccessInformationResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetPropertyAccessInformationResponse>
		>(`/properties/${propertyId}/access-information`);

		return response.data;
	};

	updatePropertyAccessInformation = async (
		propertyId: string,
		request: IUpdatePropertyAccessInformationRequest,
	): Promise<IUpdatePropertyAccessInformationResponse> => {
		const response = await apiClient.patch<
			TApiResponse<IUpdatePropertyAccessInformationResponse>,
			IUpdatePropertyAccessInformationRequest
		>(`/properties/${propertyId}/access-information`, request);

		return response.data;
	};

	private getPropertiesQueryConfig = (
		request: IGetPropertiesRequest | undefined,
	): IApiRequestConfig => {
		if (request?.companyId === undefined) {
			return {};
		}

		return {
			params: request,
		};
	};
}

export const propertyApiService = new PropertyApiService();
