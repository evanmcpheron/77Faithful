import { View } from 'react-native';

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
	return (
		<View testID='auth-login-screen'>
			<Typography size='Display'>Welcome Back</Typography>
			<Spacer size={Spacing.XSmall} />
			<Typography tone='Disabled'>
				Enter your credentials to continue
			</Typography>
			<Spacer size={Spacing.Medium} />
			<LoginForm />
			<Spacer size={Spacing.Large} />

			<TurndownButton
				testID='auth-login-submit-button'
				disabled
				onPress={() => {}}
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
