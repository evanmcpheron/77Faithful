import { View } from 'react-native';

import { TurndownButton } from '@td/components/ui/button/button.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Spacer } from '@td/components/ui/spacer/spacer.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { Spacing } from '@td/theme/spacing';

import { Divider } from '@td/components/ui/divider/divider.component';
import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { StyledDividerRow, StyledSocialButtonsRow } from './login.styles';

import { TSubmitWithIdRef } from '@td/types/global.types';
import { LoginForm } from '../forms/login/login.form';

export const LoginScreen = () => {
	const router = useRouter();
	const signInFormRef = useRef<TSubmitWithIdRef>(null);

	return (
		<View testID='auth-login-screen'>
			<Typography size='Display'>Welcome Back</Typography>
			<Spacer size={Spacing.XSmall} />
			<Typography tone='Disabled'>
				Enter your credentials to continue
			</Typography>
			<Spacer size={Spacing.Medium} />
			<LoginForm ref={signInFormRef} />
			<Spacer size={Spacing.Large} />

			<TurndownButton
				testID='auth-login-submit-button'
				onPress={() => {
					if (signInFormRef.current) {
						signInFormRef.current.submitData(
							(success: boolean, id?: string) => {
								if (id) {
									router.replace(`/(app)/(admin)/dashboard`);
								} else {
									router.replace(
										'/(app)/onboarding/create-company',
									);
								}
								console.log('success: ', success);
							},
						);
					}
				}}
			>
				Login
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
					onPress={() => {
						console.log('LOG IN WITH FACEBOOK');
					}}
				/>
				<IconButton
					name={IconName.Facebook}
					hasBackground
					accessibilityLabel={'facebook-login'}
					onPress={() => {
						console.log('LOG IN WITH FACEBOOK');
					}}
				/>
				<IconButton
					name={IconName.Apple}
					hasBackground
					accessibilityLabel={'apple-login'}
					onPress={function (): void {
						console.log('LOG IN WITH APPLE');
					}}
				/>
			</StyledSocialButtonsRow>
		</View>
	);
};
