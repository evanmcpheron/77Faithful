export interface ILoginFormProps {}

export interface ILoginFormRef {
	submitData: (callback: (success: boolean, id?: string) => void) => void;
}

export interface ILoginFormValues {
	email: string;
	password: string;
	rememberMe?: boolean;
}
