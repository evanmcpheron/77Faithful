import { useRef } from 'react';
import { View } from 'react-native';

import { useRouter, type Href } from 'expo-router';

import { TurndownButton } from '@td/components/ui/button/button.component';
import { Divider } from '@td/components/ui/divider/divider.component';
import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Spacer } from '@td/components/ui/spacer/spacer.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { Spacing } from '@td/theme/spacing';

import { RegisterForm } from '../forms/register/register.form';
import type { IRegisterFormRef } from '../forms/register/register.form.types';
import { StyledDividerRow, StyledSocialButtonsRow } from './login.styles';

export const RegisterScreen = () => {
	const router = useRouter();
	const registerFormRef = useRef<IRegisterFormRef>(null);

	const handleSubmit = () => {
		registerFormRef.current?.submitData((success: boolean) => {
			if (!success) {
				return;
			}

			router.replace('/(app)/onboarding/create-company' as Href);
		});
	};

	return (
		<View testID='auth-register-screen'>
			<Typography size='Display'>Create Account</Typography>
			<Spacer size={Spacing.XSmall} />
			<Typography tone='Disabled'>
				Enter your credentials to continue
			</Typography>
			<Spacer size={Spacing.Large} />
			<RegisterForm ref={registerFormRef} />
			<Spacer size={Spacing.Large} />
			<TurndownButton
				testID='auth-register-submit-button'
				onPress={handleSubmit}
			>
				Register
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
					accessibilityLabel={'google-register'}
					onPress={() => {
						console.log('REGISTER WITH GOOGLE');
					}}
				/>
				<IconButton
					name={IconName.Facebook}
					hasBackground
					accessibilityLabel={'facebook-register'}
					onPress={() => {
						console.log('REGISTER WITH FACEBOOK');
					}}
				/>
				<IconButton
					name={IconName.Apple}
					hasBackground
					accessibilityLabel={'apple-register'}
					onPress={function (): void {
						console.log('REGISTER WITH APPLE');
					}}
				/>
			</StyledSocialButtonsRow>
		</View>
	);
};
