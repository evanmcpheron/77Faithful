import { normalCase } from '@turndown/library/helpers';
import { formProxyRegistry } from './form.proxy';
import type {
	TFormErrors,
	TFormValidationRule,
	TFormValue,
} from './form.types';

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const hasMessage = (value: unknown): value is { message: unknown } => {
	return isRecord(value) && 'message' in value;
};

const isValidationRule = (
	value: unknown,
): value is TFormValidationRule<TFormValue> => {
	return typeof value === 'function';
};

export const getFirstErrorMessage = (errors: TFormErrors): string | null => {
	for (const key in errors) {
		const errorValue = errors[key];

		if (hasMessage(errorValue)) {
			return `${normalCase(key)}: ${String(errorValue.message)}`;
		}

		if (isRecord(errorValue)) {
			const nestedError = getFirstErrorMessage(errorValue);

			if (nestedError) {
				return nestedError;
			}
		}
	}

	return null;
};

export const hasProperties = (obj: object | null | undefined): boolean => {
	return Object.keys(obj || {}).length > 0;
};

export const getErrorMessage = (
	errors: TFormErrors,
	name: string,
): string | undefined => {
	if (!hasProperties(errors)) {
		return undefined;
	}

	const directError = errors[name];

	if (hasMessage(directError)) {
		return String(directError.message);
	}

	if (typeof directError === 'string') {
		return directError;
	}

	const nestedError = name.split('.').reduce<unknown>((currentValue, key) => {
		if (!isRecord(currentValue)) {
			return undefined;
		}

		return currentValue[key];
	}, errors);

	if (hasMessage(nestedError)) {
		return String(nestedError.message);
	}

	if (typeof nestedError === 'string') {
		return nestedError;
	}

	return undefined;
};

export const hasOwnProp = (obj: object, property: string): boolean => {
	return Object.prototype.hasOwnProperty.call(obj, property);
};

export const validateInternalComponent = (
	formName: string | undefined,
	name: string | undefined,
	value: string | undefined,
): string | undefined => {
	if (!formName || !name || !value) {
		return undefined;
	}

	const formProxy = formProxyRegistry[formName];
	const validationModelRecord = formProxy?.validationModel as
		Record<string, unknown> | undefined;
	const validateFunction = validationModelRecord?.[name];

	if (!isValidationRule(validateFunction)) {
		return undefined;
	}

	const errorMessage = validateFunction(value);

	if (errorMessage) {
		return String(errorMessage);
	}

	return undefined;
};

export const getFirstPropertyValue = <TRecord extends Record<string, unknown>>(
	obj: TRecord,
): string => {
	const keys = Object.keys(obj) as (keyof TRecord)[];

	if (keys.length === 0) {
		return '';
	}

	const firstKey = keys[0];
	const firstValue = !!firstKey ? obj[firstKey] : undefined;

	if (typeof firstValue === 'string') {
		return firstValue;
	}

	if (firstValue === null || firstValue === undefined) {
		return '';
	}

	return String(firstValue);
};
