import { forwardRef, useImperativeHandle, useState } from 'react';

import { router } from 'expo-router';

import { Checkbox } from '@td/components/form/checkbox/checkbox.component';
import { Form, useForm } from '@td/components/form/form';
import { getFirstPropertyValue } from '@td/components/form/form/form.helpers';
import type { IFormValidationModel } from '@td/components/form/form/form.types';
import { Input } from '@td/components/form/input/input.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { showErrorNotification } from '@td/components/ui/notification/notification.helper';
import { useAuth } from '@td/providers/auth/auth.hook';

import { isEmail } from '@turndown/library/helpers';
import { StyledSecondaryActionsRow } from '../../screens/login.styles';
import type {
	ILoginFormProps,
	ILoginFormRef,
	ILoginFormValues,
} from './login.form.types';

const LoginFormData = {
	name: 'formLogin',
	editValues: {
		email: 'evan.mcpheron@icloud.com',
		password: 'Password1!',
	},
} as const;

const formValidationSchema: IFormValidationModel<ILoginFormValues> = {
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
};

export const LoginForm = forwardRef<ILoginFormRef, ILoginFormProps>(
	(_props, ref) => {
		const { login } = useAuth();

		const [submittingData, setSubmittingData] = useState(false);

		const { submitForm } = useForm<ILoginFormValues>({
			formName: LoginFormData.name,
			validationModel: formValidationSchema,
			onFormErrors: () => {
				// Form error handling is done during submit.
			},
		});

		const saveData = async (formValues: ILoginFormValues) => {
			try {
				const response = await login({
					email: formValues.email.trim(),
					password: formValues.password,
					rememberMe: formValues.rememberMe === true,
				});
				return { success: true, id: response };
			} catch {
				showErrorNotification('Your email or password is incorrect');

				return { success: false };
			}
		};

		useImperativeHandle(ref, () => ({
			submitData: (callback: (success: boolean, id?: string) => void) => {
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

					const saveResult = await saveData(
						formValues as ILoginFormValues,
					);
					callback(saveResult.success, saveResult.id);
					setSubmittingData(false);
				});
			},
		}));

		return (
			<Form<ILoginFormValues>
				name={LoginFormData.name}
				editValues={LoginFormData.editValues}
			>
				<Input
					name='email'
					testID='auth-login-email-input'
					label='Email'
					type='Email'
					placeholder='example@email.com'
					icon={IconName.Mail}
				/>
				<Input
					name='password'
					testID='auth-login-password-input'
					label='Password'
					type='Password'
					placeholder='**********'
				/>
				<StyledSecondaryActionsRow>
					<Checkbox
						name='rememberMe'
						label='Stay logged in'
					/>
					<TurndownButton
						testID='auth-forgot-password-link'
						variant='Link'
						onPress={() => router.push('/(auth)/forgot-password')}
					>
						Forgot Password?
					</TurndownButton>
				</StyledSecondaryActionsRow>
			</Form>
		);
	},
);
