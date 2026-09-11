import { publishOnChannel } from '@td/utils/dom/events.util';
import type {
	IFormValidationModel,
	TFormErrorValue,
	TFormErrors,
	TFormState,
	TFormUpdate,
	TFormValidationRule,
	TFormValue,
} from './form.types';

const isFormRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isValidationRule = (
	value: unknown,
): value is TFormValidationRule<TFormValue> => {
	return typeof value === 'function';
};

export interface FormProxy<
	TFormValues extends object = Record<string, unknown>,
> {
	setValue: (field: string, value: TFormValue) => void;
	getValue: (field: string) => TFormValue;
	getFormState: () => TFormState<TFormValues>;
	registerField: (fieldName: string, initialValue: TFormValue) => void;
	deregisterField: (fieldName: string) => void;
	submitForm: (
		callback?: (
			data: TFormState<TFormValues>,
			errors?: TFormErrors<TFormValues>,
		) => void,
	) => void;
	subscribe: (field: string, callback: (value: TFormValue) => void) => void;
	unsubscribe: (field: string, callback: (value: TFormValue) => void) => void;
	validationModel?: IFormValidationModel<TFormValues>;
	onFormErrorsListeners: ((
		errors: TFormErrors<TFormValues> | undefined,
	) => void)[];
	onHandleSubmitListeners: ((formData: TFormState<TFormValues>) => void)[];
	onHandleUpdateListeners: ((formData: TFormUpdate<TFormValues>) => void)[];
	reset: () => void;
}

export const formProxyRegistry: Record<string, FormProxy> = {};

interface ICreateFormProxyParams<TFormValues extends object> {
	formName: string;
	formState: TFormState<TFormValues>;
	setErrors: (errors: TFormErrors<TFormValues> | undefined) => void;
	validationModel?: IFormValidationModel<TFormValues>;
	onFormErrors?: (errors: TFormErrors<TFormValues> | undefined) => void;
	onHandleSubmit?: (formData: TFormState<TFormValues>) => void;
	onHandleUpdate?: (formData: TFormUpdate<TFormValues>) => void;
}

export const createFormProxy = <TFormValues extends object>({
	formName,
	formState,
	setErrors,
	validationModel,
	onFormErrors,
	onHandleSubmit,
	onHandleUpdate,
}: ICreateFormProxyParams<TFormValues>): FormProxy<TFormValues> => {
	const existingFormProxy = formProxyRegistry[formName] as
		FormProxy<TFormValues> | undefined;

	if (existingFormProxy) {
		existingFormProxy.validationModel =
			validationModel ?? existingFormProxy.validationModel;
		existingFormProxy.onFormErrorsListeners = onFormErrors
			? [onFormErrors]
			: [];
		existingFormProxy.onHandleSubmitListeners = onHandleSubmit
			? [onHandleSubmit]
			: [];
		existingFormProxy.onHandleUpdateListeners = onHandleUpdate
			? [onHandleUpdate]
			: [];

		return existingFormProxy;
	}

	let mutableFormState = formState as Record<string, unknown>;
	let initialFormState = { ...mutableFormState };

	const onFormErrorsListeners: ((
		errors: TFormErrors<TFormValues> | undefined,
	) => void)[] = [];

	if (onFormErrors) {
		onFormErrorsListeners.push(onFormErrors);
	}

	const onHandleSubmitListeners: ((
		formData: TFormState<TFormValues>,
	) => void)[] = [];

	if (onHandleSubmit) {
		onHandleSubmitListeners.push(onHandleSubmit);
	}

	const onHandleUpdateListeners: ((
		formData: TFormUpdate<TFormValues>,
	) => void)[] = [];

	if (onHandleUpdate) {
		onHandleUpdateListeners.push(onHandleUpdate);
	}

	type TCallback = (value: TFormValue) => void;

	const formListeners: Record<string, Record<string, TCallback[]>> = {};

	const notifyListeners = (
		activeFormName: string,
		field: string,
		value: TFormValue,
	) => {
		if (formListeners[activeFormName]?.[field]) {
			formListeners[activeFormName][field].forEach((callback) =>
				callback(value),
			);
		}
	};

	const notifyFormUpdated = () => {
		const updatePayload = {
			isDirty:
				JSON.stringify(mutableFormState) !==
				JSON.stringify(initialFormState),
			...mutableFormState,
		} as TFormUpdate<TFormValues>;

		onHandleUpdateListeners.forEach((listener) => listener(updatePayload));
	};

	const setValue = (field: string, value: TFormValue) => {
		if (isFormRecord(value)) {
			Object.entries(value).forEach(([nestedKey, nestedValue]) => {
				setValue(`${field}.${nestedKey}`, nestedValue);
			});
		} else if (field.includes('.')) {
			const keys = field.split('.');
			let currentValue = mutableFormState;

			for (let index = 0; index < keys.length - 1; index++) {
				const key = keys[index];

				if (!isFormRecord(currentValue[key])) {
					currentValue[key] = {};
				}

				currentValue = currentValue[key] as Record<string, unknown>;
			}

			currentValue[keys[keys.length - 1]] = value;
		} else {
			mutableFormState[field] = value;
		}

		if (
			(mutableFormState[field] === undefined &&
				(initialFormState[field] === false ||
					initialFormState[field] === '')) ||
			(mutableFormState[field] === '' &&
				initialFormState[field] === undefined)
		) {
			mutableFormState[field] = initialFormState[field];
		}

		notifyFormUpdated();
		notifyListeners(formName, field, value);
	};

	const getValue = (field: string): TFormValue => {
		if (field.includes('.')) {
			const keys = field.split('.');
			let currentValue: unknown = mutableFormState;

			for (let index = 0; index < keys.length; index++) {
				if (!isFormRecord(currentValue)) {
					return undefined;
				}

				currentValue = currentValue[keys[index]];
			}

			return currentValue;
		}

		return mutableFormState[field];
	};

	const getFormState = () => {
		return mutableFormState as TFormState<TFormValues>;
	};

	const registerField = (fieldName: string, initialValue: TFormValue) => {
		if (!(fieldName in mutableFormState)) {
			mutableFormState[fieldName] = initialValue;
			initialFormState[fieldName] = initialValue;
		}
	};

	const deregisterField = (fieldName: string) => {
		delete mutableFormState[fieldName];
	};

	const validateFields = (
		data: Record<string, unknown>,
		activeValidationModel: unknown,
		newErrors: TFormErrors<TFormValues>,
		parentKey = '',
	): boolean => {
		let hasErrors = false;

		Object.entries(data).forEach(([field, value]) => {
			const fullPath = parentKey ? `${parentKey}.${field}` : field;
			const validationModelRecord = activeValidationModel as Record<
				string,
				unknown
			>;
			const validationEntry = validationModelRecord[field];

			if (isValidationRule(validationEntry)) {
				const error = validationEntry(value);

				if (error) {
					const mutableErrors = newErrors as Record<
						string,
						TFormErrorValue | undefined
					>;

					mutableErrors[fullPath] = error;
					hasErrors = true;
				}

				return;
			}

			if (isFormRecord(validationEntry) && isFormRecord(value)) {
				const nestedHasErrors = validateFields(
					value,
					validationEntry,
					newErrors,
					fullPath,
				);

				if (nestedHasErrors) {
					hasErrors = true;
				}
			}
		});

		return hasErrors;
	};

	const submitForm = (
		callback?: (
			data: TFormState<TFormValues>,
			errors?: TFormErrors<TFormValues>,
		) => void,
	) => {
		if (!formProxy.validationModel) {
			callback?.(getFormState());
			return;
		}

		const newErrors = {} as TFormErrors<TFormValues>;
		const hasErrors = validateFields(
			mutableFormState,
			formProxy.validationModel,
			newErrors,
		);

		if (hasErrors) {
			setErrors?.(newErrors);
			publishOnChannel(`form:errors:${formName}`, newErrors);

			if (onFormErrorsListeners.length > 0) {
				try {
					onFormErrorsListeners[0](newErrors);
				} catch {
					/** */
				}
			}

			try {
				callback?.(getFormState(), newErrors);
			} catch {
				/** */
			}

			return;
		}

		setErrors?.(undefined);
		publishOnChannel(`form:errors:${formName}`, undefined);

		if (onHandleSubmitListeners.length > 0) {
			try {
				onHandleSubmitListeners[0](getFormState());
			} catch {
				/** */
			}
		}

		try {
			callback?.(getFormState());
		} catch {
			/** */
		}
	};

	const reset = () => {
		mutableFormState = { ...initialFormState };
		initialFormState = { ...initialFormState };

		Object.entries(mutableFormState).forEach(([key, value]) => {
			notifyFormUpdated();
			notifyListeners(formName, key, value);
		});
	};

	const subscribe = (field: string, callback: TCallback) => {
		if (!formListeners[formName]) {
			formListeners[formName] = {};
		}

		if (!formListeners[formName][field]) {
			formListeners[formName][field] = [];
		}

		formListeners[formName][field].push(callback);
	};

	const unsubscribe = (field: string, callback: TCallback) => {
		if (formListeners[formName]?.[field]) {
			formListeners[formName][field] = formListeners[formName][
				field
			].filter((activeCallback) => activeCallback !== callback);
		}
	};

	const formProxy: FormProxy<TFormValues> = {
		setValue,
		getValue,
		getFormState,
		registerField,
		deregisterField,
		submitForm,
		subscribe,
		unsubscribe,
		validationModel,
		onFormErrorsListeners,
		onHandleSubmitListeners,
		onHandleUpdateListeners,
		reset,
	};

	formProxyRegistry[formName] = formProxy as FormProxy;

	return formProxy;
};
