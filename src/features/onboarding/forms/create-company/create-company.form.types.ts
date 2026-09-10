import type { TCompanyType, TUSStateCode } from '@turndown/library';

export interface ICreateCompanyFormProps {}

export interface ICreateCompanyFormRef {
	submitData: (
		callback: (success: boolean, companyId: string | null) => void,
	) => void;
}

export interface ICreateCompanyFormValues {
	displayName: string;
	companyType: TCompanyType | '';
	addressLine1: string;
	addressLine2: string;
	city: string;
	stateCode: TUSStateCode | '';
	postalCode: string;
}
