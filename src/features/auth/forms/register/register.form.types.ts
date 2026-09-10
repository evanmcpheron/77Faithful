import type { TAccountType } from '@turndown/library';

export interface IRegisterFormValues {
	accountType: TAccountType;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	confirmPassword: string;
	termsAccepted?: boolean;
}
