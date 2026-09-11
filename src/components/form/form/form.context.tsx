import React, { createContext, useContext, useState } from 'react';

import { useSubscriber } from '@td/hooks/use-subscriber.hook';

import { hasProperties } from './form.helpers';
import type { TFormErrors } from './form.types';

export interface IUseFormErrorsResult {
	form?: string;
	errors?: TFormErrors;
}

interface IFormContextProps {
	formName: string;
	formErrors?: IUseFormErrorsResult;
}

interface IFormProviderProps {
	formName: string;
	children: React.ReactNode;
	formErrors?: IUseFormErrorsResult;
}

const FormContext = createContext<IFormContextProps | undefined>(undefined);

export const useFormContext = (): IFormContextProps | undefined => {
	return useContext(FormContext);
};

export const useFormName = (): string => {
	const context = useContext(FormContext);

	return context?.formName || '';
};

export const useFormErrors = (): IUseFormErrorsResult | undefined => {
	const context = useContext(FormContext);
	const [subscribedFormErrors, setSubscribedFormErrors] = useState<
		IUseFormErrorsResult | undefined
	>(undefined);

	useSubscriber<TFormErrors | undefined, IUseFormErrorsResult | undefined>(
		`form:errors:${context?.formName}`,
		(errors: TFormErrors | undefined) => {
			try {
				if (hasProperties(errors || {})) {
					const nextFormErrors = {
						form: context?.formName || '',
						errors: errors || {},
					};

					setSubscribedFormErrors(nextFormErrors);

					return nextFormErrors;
				}

				setSubscribedFormErrors(undefined);
			} catch {
				setSubscribedFormErrors(undefined);
			}
		},
	);

	return subscribedFormErrors ?? context?.formErrors;
};

export const FormProvider: React.FC<IFormProviderProps> = ({
	formName,
	children,
	formErrors,
}) => {
	return (
		<FormContext.Provider value={{ formName, formErrors }}>
			{children}
		</FormContext.Provider>
	);
};
