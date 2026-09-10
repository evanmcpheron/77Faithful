import { useForm } from '@td/components/form/form';
import { View } from 'react-native';
import type { ILoginFormValues } from '../forms/login/login.form.types';
import { useAuthActions } from '../hooks/use-auth-actions.hook';

import { TurndownButton } from '@td/components/ui/button/button.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Spacer } from '@td/components/ui/spacer/spacer.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { Spacing } from '@td/theme/spacing';

import { Divider } from '@td/components/ui/divider/divider.component';
import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { StyledDividerRow, StyledSocialButtonsRow } from './login.styles';

import { LoginForm } from '../forms/login/login.form';

export const LoginScreen = () => {
	const form = useForm<ILoginFormValues>({ formName: 'formLogin' });
	const { submit, isSubmitting, error } = useAuthActions('signIn');
	return (
		<View testID='auth-login-screen'>
			<Typography size='Display'>Welcome Back</Typography>
			<Spacer size={Spacing.XSmall} />
			<Typography tone='Disabled'>
				Enter your credentials to continue
			</Typography>
			<Spacer size={Spacing.Medium} />
			<LoginForm />
			{error && (
				<View accessibilityLiveRegion='polite'>
					<Typography tone='Error'>{error}</Typography>
				</View>
			)}
			<Spacer size={Spacing.Large} />

			<TurndownButton
				testID='auth-login-submit-button'
				disabled={isSubmitting}
				loading={isSubmitting}
				onPress={() => void submit(form.getFormState())}
			>
				Sign in
			</TurndownButton>
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
					accessibilityLabel={'google-login'}
					disabled
					onPress={() => {}}
				/>
				<IconButton
					name={IconName.Facebook}
					hasBackground
					accessibilityLabel={'facebook-login'}
					disabled
					onPress={() => {}}
				/>
				<IconButton
					name={IconName.Apple}
					hasBackground
					accessibilityLabel={'apple-login'}
					disabled
					onPress={() => {}}
				/>
			</StyledSocialButtonsRow>
		</View>
	);
};
