import { hasProperties } from './form.helpers';
import { createFormProxy, type FormProxy } from './form.proxy';
import type {
	IFormValidationModel,
	TFormErrors,
	TFormState,
	TFormUpdate,
} from './form.types';

export interface IUseFormProps<TFormValues extends object> {
	formName?: string;
	defaultValues?: TFormState<TFormValues>;
	validationModel?: IFormValidationModel<TFormValues>;
	onFormErrors?: (errors: TFormErrors<TFormValues> | undefined) => void;
	onHandleSubmit?: (formData: TFormState<TFormValues>) => void;
	onHandleUpdate?: (formData: TFormUpdate<TFormValues>) => void;
}

const noopProxy: FormProxy = {
	setValue: () => {},
	getValue: () => undefined,
	getFormState: () => ({}),
	registerField: () => {},
	deregisterField: () => {},
	submitForm: () => {},
	subscribe: () => {},
	unsubscribe: () => {},
	onFormErrorsListeners: [],
	onHandleSubmitListeners: [],
	onHandleUpdateListeners: [],
	reset: () => {},
};

export const useForm = <TFormValues extends object = Record<string, unknown>>({
	formName,
	defaultValues = {},
	validationModel,
	onFormErrors,
	onHandleSubmit,
	onHandleUpdate,
}: IUseFormProps<TFormValues>): FormProxy<TFormValues> => {
	if (!formName) {
		return noopProxy as FormProxy<TFormValues>;
	}

	return createFormProxy<TFormValues>({
		formName,
		formState: defaultValues,
		setErrors: (errors: TFormErrors<TFormValues> | undefined) => {
			if (errors && hasProperties(errors)) {
				onFormErrors?.(errors);
				return;
			}

			onFormErrors?.(undefined);
		},
		validationModel,
		onFormErrors,
		onHandleSubmit,
		onHandleUpdate,
	});
};
