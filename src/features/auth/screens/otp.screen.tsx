import { TurndownButton } from '@td/components/ui/button/button.component';
import { Spacer } from '@td/components/ui/spacer/spacer.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { Spacing } from '@td/theme/spacing';
import { useState } from 'react';
import { View } from 'react-native';

export const OtpScreen = () => {
	const { account, sendEmailVerification, refreshAccount, signOut } =
		useAuth();
	const [isWorking, setIsWorking] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const performAction = async (action: 'resend' | 'refresh' | 'signOut') => {
		setIsWorking(true);
		setMessage(null);
		try {
			if (action === 'resend') {
				await sendEmailVerification();
				setMessage('Confirmation email sent. Please check your inbox.');
			} else if (action === 'refresh') {
				const refreshed = await refreshAccount();
				if (refreshed && !refreshed.isEmailConfirmed) {
					setMessage(
						'Your email is not confirmed yet. Open the link in your inbox, then check again.',
					);
				}
			} else {
				await signOut();
			}
		} catch {
			setMessage('We could not complete that request. Please try again.');
		} finally {
			setIsWorking(false);
		}
	};

	return (
		<View testID='auth-confirm-email-screen'>
			<Typography size='Display'>Confirm your email</Typography>
			<Spacer size={Spacing.Small} />
			<Typography>
				Confirm {account?.contactEmail ?? 'your email address'} to
				continue. Open the link in your inbox, or request a confirmation
				email below.
			</Typography>
			<Spacer size={Spacing.Large} />
			<TurndownButton
				disabled={isWorking}
				onPress={() => void performAction('refresh')}
			>
				I’ve confirmed my email
			</TurndownButton>
			<Spacer size={Spacing.Small} />
			<TurndownButton
				variant='Outline'
				disabled={isWorking}
				onPress={() => void performAction('resend')}
			>
				Send confirmation email
			</TurndownButton>
			<Spacer size={Spacing.Small} />
			<TurndownButton
				variant='Outline'
				disabled={isWorking}
				onPress={() => void performAction('signOut')}
			>
				Sign out
			</TurndownButton>
			{message && (
				<View accessibilityLiveRegion='polite'>
					<Spacer size={Spacing.Small} />
					<Typography>{message}</Typography>
				</View>
			)}
		</View>
	);
};
