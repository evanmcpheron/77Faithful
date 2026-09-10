import { Input } from '@td/components/form/input/input.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Spacer } from '@td/components/ui/spacer/spacer.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { Spacing } from '@td/theme/spacing';
import { TypographySize } from '@td/theme/typography';
import { TextAlign } from '@td/types/ui.types';
import { View } from 'react-native';

export const ForgotPasswordScreen = () => {
	const { forgotPassword } = useAuth();
	return (
		<View testID='auth-forgot-password-screen'>
			<Card>
				<View>
					<Typography size='Display'>Reset Password</Typography>
					<Spacer size={Spacing.XSmall} />
					<Typography tone='Disabled'>
						Enter your email to receive password reset instructions
					</Typography>
					<Spacer size={Spacing.Medium} />

					<Input
						testID='auth-forgot-password-email-input'
						label='Email'
						type='Email'
						placeholder='example@email.com'
						icon={IconName.Mail}
						onChange={(text: string): void => {
							console.log(
								`🚀[ROCKETLOG] ~ forgot-password.screen.tsx:33 ~ text:`,
								text,
							);
						}}
					/>
					<Spacer size={Spacing.Large} />
					<TurndownButton
						testID='auth-forgot-password-submit-button'
						onPress={() => {
							forgotPassword('email@example.com');
						}}
					>
						Send Reset Link
					</TurndownButton>
				</View>
			</Card>
			<Spacer size={Spacing.Small} />
			<Typography
				size={TypographySize.Body2}
				align={TextAlign.Center}
				tone='Disabled'
			>
				If there's an account assiciated with this email, we'll send a
				reset link.
			</Typography>
		</View>
	);
};
