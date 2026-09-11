import { Checkbox } from '@td/components/form/checkbox/checkbox.component';
import { Form } from '@td/components/form/form';
import { Input } from '@td/components/form/input/input.component';
import { IconName } from '@td/components/ui/icon/icon.types';

import { StyledSecondaryActionsRow } from '../../screens/login.styles';
import type { IRegisterFormValues } from './register.form.types';

const RegisterFormData: {
	name: string;
	defaultValue: IRegisterFormValues;
} = {
	name: 'formRegister',
	defaultValue: {
		preferredName: '',
		email: '',
		password: '',
		confirmPassword: '',
		termsAccepted: true,
	},
};

export const RegisterForm = () => {
	return (
		<Form<IRegisterFormValues>
			name={RegisterFormData.name}
			editValues={RegisterFormData.defaultValue}
		>
			<Input
				name='preferredName'
				testID='auth-register-preferred-name-input'
				label='Preferred name (optional)'
				type='Text'
				placeholder='What would you like to be called?'
			/>
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
};
