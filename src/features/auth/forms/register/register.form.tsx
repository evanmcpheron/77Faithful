import { forwardRef, useImperativeHandle, useState } from 'react';

import { ACCOUNT_TYPE, type TAccountType } from '@turndown/library';
import { isEmail } from '@turndown/library/helpers';

import { Checkbox } from '@td/components/form/checkbox/checkbox.component';
import { Dropdown } from '@td/components/form/dropdown/dropdown.component';
import { Form, useForm } from '@td/components/form/form';
import type { IFormValidationModel } from '@td/components/form/form/form.types';
import { Input } from '@td/components/form/input/input.component';
import { Row } from '@td/components/layout/row/row.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { showErrorNotification } from '@td/components/ui/notification/notification.helper';
import { Spacer } from '@td/components/ui/spacer/spacer.component';
import { AccountTypeOptions } from '@td/constants/app.constants';
import { useAuth } from '@td/providers/auth/auth.hook';
import { Spacing } from '@td/theme/spacing';

import { getFirstPropertyValue } from '@td/components/form/form/form.helpers';
import { StyledSecondaryActionsRow } from '../../screens/login.styles';
import type {
	IRegisterFormProps,
	IRegisterFormRef,
	IRegisterFormValues,
} from './register.form.types';

const RegisterFormData: {
	name: string;
	defaultValue: IRegisterFormValues;
} = {
	name: 'formRegister',
	defaultValue: {
		accountType: ACCOUNT_TYPE.ACCOUNT_ADMIN,
		firstName: 'Evan',
		lastName: 'McPheron',
		email: 'evan.mcpheron@icloud.com',
		password: 'Password1!',
		confirmPassword: 'Password1!',
		termsAccepted: true,
	},
};

const formValidationSchema: IFormValidationModel<IRegisterFormValues> = {
	accountType: (accountTypeValue) => {
		return accountTypeValue.length > 0
			? undefined
			: 'Select at least one business type.';
	},
	firstName: (firstNameValue) => {
		return firstNameValue.trim().length > 0
			? undefined
			: 'First name is required.';
	},
	lastName: (lastNameValue) => {
		return lastNameValue.trim().length > 0
			? undefined
			: 'Last name is required.';
	},
	email: (emailValue) => {
		const trimmedEmail = emailValue.trim();

		if (!trimmedEmail) {
			return 'Email is required.';
		}

		return isEmail(trimmedEmail)
			? undefined
			: 'Enter a valid email address.';
	},
	password: (passwordValue) => {
		if (!passwordValue) {
			return 'Password is required.';
		}

		return passwordValue.length >= 6
			? undefined
			: 'Password must be at least 6 characters.';
	},
	confirmPassword: (confirmPasswordValue) => {
		return confirmPasswordValue
			? undefined
			: 'Confirm password is required.';
	},
	termsAccepted: (termsAcceptedValue) => {
		return termsAcceptedValue
			? undefined
			: 'You must accept the terms of use.';
	},
};

export const RegisterForm = forwardRef<IRegisterFormRef, IRegisterFormProps>(
	(_props, ref) => {
		const { register } = useAuth();
		const [submittingData, setSubmittingData] = useState(false);

		const { submitForm } = useForm<IRegisterFormValues>({
			formName: RegisterFormData.name,
			validationModel: formValidationSchema,
			onFormErrors: () => {
				// Form error handling is done during submit.
			},
		});

		const saveData = async (formValues: IRegisterFormValues) => {
			try {
				await register({
					accountType: formValues.accountType,
					email: formValues.email.trim(),
					password: formValues.password,
					firstName: formValues.firstName.trim(),
					lastName: formValues.lastName.trim(),
				});

				return true;
			} catch {
				showErrorNotification(
					'Unable to create your account. Please try again.',
				);

				return false;
			}
		};

		useImperativeHandle(ref, () => ({
			submitData: (callback: (success: boolean) => void) => {
				if (submittingData) {
					return;
				}

				setSubmittingData(true);

				submitForm(async (formValues, errors) => {
					if (errors) {
						showErrorNotification(getFirstPropertyValue(errors));
						setSubmittingData(false);
						callback(false);
						return;
					}

					if (formValues.password !== formValues.confirmPassword) {
						showErrorNotification('Passwords do not match.');
						setSubmittingData(false);
						callback(false);
						return;
					}

					const saveResult = await saveData(
						formValues as IRegisterFormValues,
					);

					callback(saveResult);
					setSubmittingData(false);
				});
			},
		}));

		return (
			<Form<IRegisterFormValues>
				name={RegisterFormData.name}
				editValues={RegisterFormData.defaultValue}
			>
				<Dropdown<TAccountType>
					name='accountType'
					testID='auth-register-account-type-dropdown'
					label='Account Type'
					options={AccountTypeOptions}
					placeholder='Select one or more services'
					defaultValue={RegisterFormData.defaultValue.accountType}
				/>
				<Spacer size={Spacing.Small} />
				<Row>
					<Input
						name='firstName'
						testID='auth-register-first-name-input'
						label='First Name'
						type='Text'
						placeholder='First Name'
					/>
					<Input
						name='lastName'
						testID='auth-register-last-name-input'
						label='Last Name'
						type='Text'
						placeholder='Last Name'
					/>
				</Row>
				<Input
					name='email'
					testID='auth-register-email-input'
					label='Email'
					type='Email'
					placeholder='example@email.com'
					icon={IconName.Mail}
				/>
				<Input
					name='password'
					testID='auth-register-password-input'
					label='Password'
					type='Password'
					placeholder='**********'
				/>
				<Input
					name='confirmPassword'
					testID='auth-register-confirm-password-input'
					label='Confirm Password'
					type='Password'
					placeholder='**********'
				/>
				<StyledSecondaryActionsRow>
					<Checkbox
						name='termsAccepted'
						label='Accept the terms of use'
					/>
				</StyledSecondaryActionsRow>
			</Form>
		);
	},
);
