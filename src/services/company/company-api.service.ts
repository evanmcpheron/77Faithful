import type {
	IAcceptCompanyInvitationResponse,
	ICreateCompanyRequest,
	ICreateCompanyResponse,
	IDeclineCompanyInvitationResponse,
	IGetCompaniesQuery,
	IGetCompaniesResponse,
	IGetCompanyByIdResponse,
	IGetCompanyUsersResponse,
	IGetPendingCompanyInvitationsResponse,
	IGetUserCompaniesResponse,
	IInviteCompanyToCompanyRequest,
	IInviteCompanyToCompanyResponse,
	IInviteUserToCompanyRequest,
	IInviteUserToCompanyResponse,
	IRevokeCompanyInvitationResponse,
	IUpdateCompanyRequest,
	IUpdateCompanyResponse,
	IValidateCompanyInvitationResponse,
} from '@turndown/library';

import { apiClient } from '@td/services/api/api-client.instance';
import type {
	IApiRequestConfig,
	TApiResponse,
} from '@td/services/api/api.types';

import type { ICompanyApiService } from './company.types';

class CompanyApiService implements ICompanyApiService {
	getCompanies = async (
		query?: IGetCompaniesQuery,
	): Promise<IGetCompaniesResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetCompaniesResponse>
		>('/companies', this.getQueryConfig(query));

		return response.data;
	};

	createCompany = async (
		request: ICreateCompanyRequest,
	): Promise<ICreateCompanyResponse> => {
		const response = await apiClient.post<
			TApiResponse<ICreateCompanyResponse>,
			ICreateCompanyRequest
		>('/companies', request);

		return response.data;
	};

	getUserCompanies = async (
		userId: string,
	): Promise<IGetUserCompaniesResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetUserCompaniesResponse>
		>(`/companies/${userId}/companies`);

		return response.data;
	};

	getCompanyUsers = async (
		companyId: string,
	): Promise<IGetCompanyUsersResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetCompanyUsersResponse>
		>(`/companies/${companyId}/users`);

		return response.data;
	};

	inviteUserToCompany = async (
		companyId: string,
		request: IInviteUserToCompanyRequest,
	): Promise<IInviteUserToCompanyResponse> => {
		const response = await apiClient.post<
			TApiResponse<IInviteUserToCompanyResponse>,
			IInviteUserToCompanyRequest
		>(`/companies/${companyId}/invite`, request);

		return response.data;
	};

	getCompanyById = async (
		companyId: string,
	): Promise<IGetCompanyByIdResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetCompanyByIdResponse>
		>(`/companies/${companyId}`);

		return response.data;
	};

	updateCompany = async (
		companyId: string,
		request: IUpdateCompanyRequest,
	): Promise<IUpdateCompanyResponse> => {
		const response = await apiClient.patch<
			TApiResponse<IUpdateCompanyResponse>,
			IUpdateCompanyRequest
		>(`/companies/${companyId}`, request);

		return response.data;
	};

	inviteCompanyToCompany = async (
		companyId: string,
		request: IInviteCompanyToCompanyRequest,
	): Promise<IInviteCompanyToCompanyResponse> => {
		const response = await apiClient.post<
			TApiResponse<IInviteCompanyToCompanyResponse>,
			IInviteCompanyToCompanyRequest
		>(`/companies/${companyId}/invite/company`, request);

		return response.data;
	};

	getPendingCompanyInvitations = async (
		companyId: string,
	): Promise<IGetPendingCompanyInvitationsResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetPendingCompanyInvitationsResponse>
		>(`/companies/${companyId}/invitations`);

		return response.data;
	};

	validateCompanyInvitation = async (
		token: string,
	): Promise<IValidateCompanyInvitationResponse> => {
		const response = await apiClient.get<
			TApiResponse<IValidateCompanyInvitationResponse>
		>(`/companies/invitations/${token}/validate`, {
			skipAuth: true,
			skipRefresh: true,
		});

		return response.data;
	};

	acceptCompanyInvitation = async (
		token: string,
	): Promise<IAcceptCompanyInvitationResponse> => {
		const response = await apiClient.post<
			TApiResponse<IAcceptCompanyInvitationResponse>,
			Record<string, never>
		>(`/companies/invitations/${token}/accept`, {});

		return response.data;
	};

	declineCompanyInvitation = async (
		token: string,
	): Promise<IDeclineCompanyInvitationResponse> => {
		const response = await apiClient.post<
			TApiResponse<IDeclineCompanyInvitationResponse>,
			Record<string, never>
		>(`/companies/invitations/${token}/decline`, {});

		return response.data;
	};

	revokeCompanyInvitation = async (
		companyId: string,
		invitationId: string,
	): Promise<IRevokeCompanyInvitationResponse> => {
		const response = await apiClient.delete<
			TApiResponse<IRevokeCompanyInvitationResponse>
		>(`/companies/${companyId}/invitations/${invitationId}`);

		return response.data;
	};

	private getQueryConfig = (
		query: IGetCompaniesQuery | undefined,
	): IApiRequestConfig => {
		if (query === undefined) {
			return {};
		}

		return {
			params: query,
		};
	};
}

export const companyApiService = new CompanyApiService();
