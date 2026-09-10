import type { ReactNode } from 'react';

import { DomProperties } from '@td/types/ui.types';

export type TFormValue = unknown;

export type TFormState<TFormValues extends object = Record<string, unknown>> =
	Partial<TFormValues>;

export type TFormValidationResult = string | undefined;

export type TFormValidationRule<
	TValue = TFormValue,
	TValidationResult = TFormValidationResult,
> = (value: TValue) => TValidationResult;

type TFormValidationEntry<TValue, TValidationResult = TFormValidationResult> =
	NonNullable<TValue> extends object
		? | TFormValidationRule<TValue, TValidationResult>
			| IFormValidationModel<NonNullable<TValue>, TValidationResult>
		: TFormValidationRule<TValue, TValidationResult>;

export type IFormValidationModel<
	TFormValues extends object = Record<string, unknown>,
	TValidationResult = TFormValidationResult,
> = {
	[TField in keyof TFormValues]?: TFormValidationEntry<
		TFormValues[TField],
		TValidationResult
	>;
};

export interface IFormErrorMessage {
	message: string;
}

export interface IFormErrorMap {
	[field: string]: TFormErrorValue | undefined;
}

export type TFormErrorValue = string | IFormErrorMessage | IFormErrorMap;

export type TFormErrors<TFormValues extends object = Record<string, unknown>> =
	Partial<Record<Extract<keyof TFormValues, string>, TFormErrorValue>> &
		IFormErrorMap;

export type TFormUpdate<TFormValues extends object> =
	TFormState<TFormValues> & {
		isDirty: boolean;
	};

export interface IFormErrors<TFormValues extends object> {
	firstError: string | null;
	allErrors: TFormErrors<TFormValues>;
}

export interface FormProps<TFormValues extends object> extends DomProperties {
	name: string;
	children: ReactNode;
	defaultValues?: TFormState<TFormValues>;
	editValues?: TFormState<TFormValues>;
	validationModel?: IFormValidationModel<TFormValues>;
}
