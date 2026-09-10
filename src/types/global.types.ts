export {
	SEVERITY as Severity,
	SeverityOptions,
	STATUS as Status,
	StatusOptions,
	type TSeverity,
	type TStatus,
} from '@turndown/library';

export type TSubmitRef = {
	submitData: (callback: (success: boolean) => void) => void;
};

export type TSubmitWithIdRef = {
	submitData: (callback: (success: boolean, id?: string) => void) => void;
};
