import { router } from 'expo-router';

import { Checkbox } from '@td/components/form/checkbox/checkbox.component';
import { Form } from '@td/components/form/form';
import { Input } from '@td/components/form/input/input.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { IconName } from '@td/components/ui/icon/icon.types';

import { StyledSecondaryActionsRow } from '../../screens/login.styles';
import type { ILoginFormValues } from './login.form.types';

const LoginFormData = {
	name: 'formLogin',
	editValues: {
		email: '',
		password: '',
	},
} as const;

export const LoginForm = () => {
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
};
