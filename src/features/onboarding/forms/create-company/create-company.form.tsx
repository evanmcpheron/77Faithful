import { forwardRef, useImperativeHandle, useState } from 'react';

import type {
	ICreateCompanyRequest,
	ISelectOption,
	TCompanyType,
	TUSStateCode,
} from '@turndown/library';
import { COMPANY_TYPES, US_JURISDICTIONS } from '@turndown/library';
import { normalCase } from '@turndown/library/helpers';

import { Dropdown } from '@td/components/form/dropdown/dropdown.component';
import { Form, useForm } from '@td/components/form/form';
import { getFirstPropertyValue } from '@td/components/form/form/form.helpers';
import type { IFormValidationModel } from '@td/components/form/form/form.types';
import { Input } from '@td/components/form/input/input.component';
import { showErrorNotification } from '@td/components/ui/notification/notification.helper';
import { Typography } from '@td/components/ui/typography/typography.component';
import { companyApiService } from '@td/services/company/company-api.service';
import { TypographySize, TypographyWeight } from '@td/theme/typography';

import {
	StyledCreateCompanyForm,
	StyledCreateCompanyFormRow,
	StyledCreateCompanyFormRowItem,
} from './create-company.form.styles';
import type {
	ICreateCompanyFormProps,
	ICreateCompanyFormRef,
	ICreateCompanyFormValues,
} from './create-company.form.types';

const CompanyTypeOptions = Object.values(COMPANY_TYPES).map((companyType) => ({
	label: normalCase(companyType),
	value: companyType,
})) as ISelectOption<TCompanyType>[];

const StateCodeOptions = Object.entries(US_JURISDICTIONS).map(
	([stateCode, stateName]) => ({
		label: stateName,
		value: stateCode,
	}),
) as ISelectOption<TUSStateCode>[];

const CreateCompanyFormData: {
	formName: string;
	defaultValues: ICreateCompanyFormValues;
} = {
	formName: 'formCreateCompany',
	defaultValues: {
		displayName: '',
		companyType: '',
		addressLine1: '',
		addressLine2: '',
		city: '',
		stateCode: '',
		postalCode: '',
	},
};

const formValidationSchema: IFormValidationModel<ICreateCompanyFormValues> = {
	displayName: (displayNameValue) => {
		return displayNameValue.trim().length > 0
			? undefined
			: 'Company name is required.';
	},
	companyType: (companyTypeValue) => {
		return companyTypeValue ? undefined : 'Company type is required.';
	},
	addressLine1: (addressLine1Value) => {
		return addressLine1Value.trim().length > 0
			? undefined
			: 'Address line 1 is required.';
	},
	city: (cityValue) => {
		return cityValue.trim().length > 0 ? undefined : 'City is required.';
	},
	stateCode: (stateCodeValue) => {
		return stateCodeValue ? undefined : 'State is required.';
	},
	postalCode: (postalCodeValue) => {
		return postalCodeValue.trim().length > 0
			? undefined
			: 'ZIP code is required.';
	},
};

const buildCreateCompanyRequest = (
	formValues: ICreateCompanyFormValues,
): ICreateCompanyRequest => {
	const addressLine2 = formValues.addressLine2.trim();

	return {
		displayName: formValues.displayName.trim(),
		companyType: formValues.companyType as TCompanyType,
		addressLine1: formValues.addressLine1.trim(),
		...(addressLine2 ? { addressLine2 } : {}),
		city: formValues.city.trim(),
		stateCode: formValues.stateCode as TUSStateCode,
		postalCode: formValues.postalCode.trim(),
	};
};

export const CreateCompanyForm = forwardRef<
	ICreateCompanyFormRef,
	ICreateCompanyFormProps
>((_props, ref) => {
	const { createCompany } = companyApiService;
	const [submittingData, setSubmittingData] = useState(false);

	const { submitForm } = useForm<ICreateCompanyFormValues>({
		formName: CreateCompanyFormData.formName,
		validationModel: formValidationSchema,
		onFormErrors: () => {
			// Form error handling is done during submit.
		},
	});

	const saveData = async (formValues: ICreateCompanyFormValues) => {
		try {
			const createCompanyResponse = await createCompany(
				buildCreateCompanyRequest(formValues),
			);

			return {
				success: true,
				id: createCompanyResponse.id,
			};
		} catch {
			showErrorNotification(
				'Unable to create company. Please try again.',
			);

			return {
				success: false,
				id: null,
			};
		}
	};

	useImperativeHandle(ref, () => ({
		submitData: (
			callback: (success: boolean, companyId: string | null) => void,
		) => {
			if (submittingData) {
				return;
			}

			setSubmittingData(true);

			submitForm(async (formValues, errors) => {
				if (errors) {
					showErrorNotification(getFirstPropertyValue(errors));
					setSubmittingData(false);
					callback(false, null);
					return;
				}

				const saveResult = await saveData(
					formValues as ICreateCompanyFormValues,
				);

				callback(saveResult.success, saveResult.id);
				setSubmittingData(false);
			});
		},
	}));

	return (
		<Form<ICreateCompanyFormValues>
			name={CreateCompanyFormData.formName}
			editValues={CreateCompanyFormData.defaultValues}
		>
			<StyledCreateCompanyForm>
				<Input
					name='displayName'
					label='Company Name'
					placeholder='Enter company name'
				/>
				<Dropdown<TCompanyType>
					name='companyType'
					label='Company Type'
					options={CompanyTypeOptions}
					placeholder='Select company type'
				/>
				<Typography
					size={TypographySize.H1}
					weight={TypographyWeight.Bold}
				>
					Business Address
				</Typography>
				<Input
					name='addressLine1'
					label='Address Line 1'
					placeholder='Enter street address'
				/>
				<Input
					name='addressLine2'
					label='Address Line 2'
					placeholder='Suite, unit, etc.'
				/>
				<Input
					name='city'
					label='City'
					placeholder='City'
				/>
				<StyledCreateCompanyFormRow>
					<StyledCreateCompanyFormRowItem>
						<Dropdown<TUSStateCode>
							name='stateCode'
							label='State'
							options={StateCodeOptions}
							placeholder='State'
						/>
					</StyledCreateCompanyFormRowItem>
					<StyledCreateCompanyFormRowItem>
						<Input
							name='postalCode'
							label='ZIP Code'
							type='Number'
							placeholder='ZIP Code'
						/>
					</StyledCreateCompanyFormRowItem>
				</StyledCreateCompanyFormRow>
			</StyledCreateCompanyForm>
		</Form>
	);
});
