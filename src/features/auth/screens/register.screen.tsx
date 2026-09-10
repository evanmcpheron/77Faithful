import { useForm } from '@td/components/form/form';
import { View } from 'react-native';
import type { IRegisterFormValues } from '../forms/register/register.form.types';
import { useAuthActions } from '../hooks/use-auth-actions.hook';

import { TurndownButton } from '@td/components/ui/button/button.component';
import { Divider } from '@td/components/ui/divider/divider.component';
import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Spacer } from '@td/components/ui/spacer/spacer.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { Spacing } from '@td/theme/spacing';

import { RegisterForm } from '../forms/register/register.form';
import { StyledDividerRow, StyledSocialButtonsRow } from './login.styles';

export const RegisterScreen = () => {
	const form = useForm<IRegisterFormValues>({ formName: 'formRegister' });
	const { submit, isSubmitting, error } = useAuthActions('signUp');
	return (
		<View testID='auth-register-screen'>
			<Typography size='Display'>Create Account</Typography>
			<Spacer size={Spacing.XSmall} />
			<Typography tone='Disabled'>
				Enter your credentials to continue
			</Typography>
			<Spacer size={Spacing.Large} />
			<RegisterForm />
			{error && (
				<View accessibilityLiveRegion='polite'>
					<Typography tone='Error'>{error}</Typography>
				</View>
			)}
			<Spacer size={Spacing.Large} />
			<TurndownButton
				testID='auth-register-submit-button'
				disabled={isSubmitting}
				loading={isSubmitting}
				onPress={() => void submit(form.getFormState())}
			>
				Create account
			</TurndownButton>
			<Spacer size={Spacing.Small} />
			<Typography tone='Muted'>
				Creating an account doesn’t start Day 1. Confirm your email
				before setting up your 77 days.
			</Typography>
			<Spacer size={Spacing.Large} />
			<StyledDividerRow>
				<Divider />
				<Typography size='Body2'>Or Continue With</Typography>
				<Divider />
			</StyledDividerRow>
			<StyledSocialButtonsRow>
				<IconButton
					name={IconName.Google}
					hasBackground
					accessibilityLabel={'google-register'}
					disabled
					onPress={() => {}}
				/>
				<IconButton
					name={IconName.Facebook}
					hasBackground
					accessibilityLabel={'facebook-register'}
					disabled
					onPress={() => {}}
				/>
				<IconButton
					name={IconName.Apple}
					hasBackground
					accessibilityLabel={'apple-register'}
					disabled
					onPress={() => {}}
				/>
			</StyledSocialButtonsRow>
		</View>
	);
};
