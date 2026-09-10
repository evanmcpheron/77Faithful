import React, { useEffect, useState } from 'react';

import { View } from 'react-native';

import { showErrorNotification } from '@td/components/ui/notification/notification.helper';

import { FormProvider, type IUseFormErrorsResult } from './form.context';
import { getFirstPropertyValue, hasProperties } from './form.helpers';
import type { FormProps, TFormState } from './form.types';
import { useForm } from './useForm.hook';

type FormComponentProps<TFormValues extends object> = FormProps<TFormValues>;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const Form = <TFormValues extends object>({
	name,
	children,
	defaultValues = {} as TFormState<TFormValues>,
	editValues = {} as TFormState<TFormValues>,
	validationModel,
}: FormComponentProps<TFormValues>) => {
	const [formErrors, setFormErrors] = useState<
		IUseFormErrorsResult | undefined
	>({});

	const formProxy = useForm<TFormValues>({
		formName: name,
		defaultValues,
		validationModel,
		onFormErrors: (errors) => {
			if (errors && hasProperties(errors)) {
				setFormErrors({
					form: name,
					errors,
				});

				showErrorNotification(getFirstPropertyValue(errors));
			} else {
				setFormErrors(undefined);
			}
		},
		onHandleSubmit: () => {},
	});

	useEffect(() => {
		const setNestedValues = (values: object, parentKey = '') => {
			Object.entries(values).forEach(([key, value]) => {
				const fullKey = parentKey ? `${parentKey}.${key}` : key;

				if (isPlainObject(value)) {
					setNestedValues(value, fullKey);
					return;
				}

				formProxy.setValue(fullKey, value);
			});
		};

		if (editValues && formProxy) {
			setNestedValues(editValues);
		}

		return () => {
			formProxy?.deregisterField(name);
		};
	}, [editValues, formProxy, name]);

	return (
		<FormProvider
			formName={name}
			formErrors={formErrors}
		>
			<View style={[{ flex: 1, justifyContent: 'center' }]}>
				{children}
			</View>
		</FormProvider>
	);
};

export { Form };
