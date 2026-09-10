import type { TAccountType } from '@turndown/library';

export interface IRegisterFormProps {}

export interface IRegisterFormRef {
	submitData: (callback: (success: boolean) => void) => void;
}

export interface IRegisterFormValues {
	accountType: TAccountType;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	confirmPassword: string;
	termsAccepted?: boolean;
}
