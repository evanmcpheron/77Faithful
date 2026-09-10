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

export interface ICompanyApiService {
	getCompanies: (
		query?: IGetCompaniesQuery,
	) => Promise<IGetCompaniesResponse>;
	createCompany: (
		request: ICreateCompanyRequest,
	) => Promise<ICreateCompanyResponse>;
	getUserCompanies: (userId: string) => Promise<IGetUserCompaniesResponse>;
	getCompanyUsers: (companyId: string) => Promise<IGetCompanyUsersResponse>;
	inviteUserToCompany: (
		companyId: string,
		request: IInviteUserToCompanyRequest,
	) => Promise<IInviteUserToCompanyResponse>;
	getCompanyById: (companyId: string) => Promise<IGetCompanyByIdResponse>;
	updateCompany: (
		companyId: string,
		request: IUpdateCompanyRequest,
	) => Promise<IUpdateCompanyResponse>;
	inviteCompanyToCompany: (
		companyId: string,
		request: IInviteCompanyToCompanyRequest,
	) => Promise<IInviteCompanyToCompanyResponse>;
	getPendingCompanyInvitations: (
		companyId: string,
	) => Promise<IGetPendingCompanyInvitationsResponse>;
	validateCompanyInvitation: (
		token: string,
	) => Promise<IValidateCompanyInvitationResponse>;
	acceptCompanyInvitation: (
		token: string,
	) => Promise<IAcceptCompanyInvitationResponse>;
	declineCompanyInvitation: (
		token: string,
	) => Promise<IDeclineCompanyInvitationResponse>;
	revokeCompanyInvitation: (
		companyId: string,
		invitationId: string,
	) => Promise<IRevokeCompanyInvitationResponse>;
}
