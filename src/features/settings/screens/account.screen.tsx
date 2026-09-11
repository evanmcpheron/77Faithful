import { Input } from '@td/components/form/input/input.component';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAccountProfile } from '@td/features/account/use-account-profile.hook';
import { useAuth } from '@td/providers/auth/auth.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { accountStyles as styles } from './account.styles';

const AccountDetails = ({
	account,
}: {
	account: IAuthenticatedAccountIdentity;
}) => {
	const { signOut, sendPasswordResetEmail } = useAuth();
	const profile = useAccountProfile(account.userId);
	const [pending, setPending] = useState<'reset' | 'signOut' | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [resetSent, setResetSent] = useState(false);
	const busy = useRef(false);
	const runAction = async (action: 'reset' | 'signOut') => {
		if (busy.current || profile.saving) return;
		if (action === 'reset' && !account.contactEmail) return;
		busy.current = true;
		setPending(action);
		setActionError(null);
		try {
			if (action === 'signOut') await signOut();
			else if (account.contactEmail) {
				await sendPasswordResetEmail(account.contactEmail);
				setResetSent(true);
			}
		} catch {
			setActionError(
				action === 'signOut'
					? 'We could not sign you out. Please try again.'
					: 'We could not send the recovery email. Please try again.',
			);
		} finally {
			busy.current = false;
			setPending(null);
		}
	};
	return (
		<View style={styles.column}>
			<Card>
				<View style={styles.section}>
					<View accessibilityRole='header'>
						<Typography size='H2'>Personal details</Typography>
					</View>
					{profile.loading ? (
						<Typography tone='Secondary'>
							Loading your profile…
						</Typography>
					) : (
						<Input
							ignoreForm
							label='Preferred name (optional)'
							value={profile.name}
							onChange={profile.changeName}
							disabled={profile.saving || !!pending}
							{...(profile.validationError && {
								errorMessage: profile.validationError,
							})}
							testID='account-preferred-name'
						/>
					)}
					{profile.error && (
						<View accessibilityLiveRegion='polite'>
							<Typography tone='Error'>
								{profile.error}
							</Typography>
						</View>
					)}
					{profile.canReload && (
						<TurndownButton
							variant='Outline'
							disabled={!!pending}
							onPress={profile.reload}
						>
							Reload profile
						</TurndownButton>
					)}
					<TurndownButton
						fullWidth
						disabled={!profile.canSave || !!pending}
						loading={profile.saving}
						onPress={() => void profile.save()}
					>
						Save
					</TurndownButton>
					{profile.saved && (
						<View accessibilityLiveRegion='polite'>
							<Typography tone='Secondary'>
								Your name is saved.
							</Typography>
						</View>
					)}
				</View>
			</Card>
			<View style={styles.section}>
				<View accessibilityRole='header'>
					<Typography size='H2'>Sign-in details</Typography>
				</View>
				<Card>
					<View style={styles.section}>
						<View style={styles.heading}>
							<Typography size='H3'>Email address</Typography>
							<Typography weight='Regular'>
								{account.contactEmail ??
									'No email address available.'}
							</Typography>
							<Typography
								size='Body2'
								tone='Secondary'
								weight='Regular'
							>
								{account.isEmailConfirmed
									? 'Email confirmed'
									: 'Email not confirmed'}
							</Typography>
						</View>
						<Typography
							size='Body2'
							tone='Secondary'
							weight='Regular'
						>
							To choose a new password, we’ll send a recovery link
							to your email address.
						</Typography>
						<TurndownButton
							variant='Outline'
							fullWidth
							disabled={
								!account.contactEmail ||
								!!pending ||
								profile.saving ||
								resetSent
							}
							loading={pending === 'reset'}
							onPress={() => void runAction('reset')}
						>
							Send recovery email
						</TurndownButton>
						{resetSent && (
							<View accessibilityLiveRegion='polite'>
								<Typography tone='Secondary'>
									Recovery email sent. Check your inbox and
									spam folder.
								</Typography>
							</View>
						)}
					</View>
				</Card>
			</View>
			<View style={styles.section}>
				<View accessibilityRole='header'>
					<Typography size='H2'>Sign out</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					You can sign in again to return to your journey.
				</Typography>
				<TurndownButton
					variant='Solid'
					tone='Error'
					fullWidth
					disabled={!!pending || profile.saving}
					loading={pending === 'signOut'}
					onPress={() => void runAction('signOut')}
				>
					Sign out
				</TurndownButton>
			</View>
			{actionError && (
				<View accessibilityLiveRegion='polite'>
					<Typography tone='Error'>{actionError}</Typography>
				</View>
			)}
			<View style={styles.heading}>
				<View accessibilityRole='header'>
					<Typography size='H2'>Delete account</Typography>
				</View>
				<Typography
					size='Body2'
					tone='Secondary'
					weight='Regular'
				>
					Account deletion is not available in this version.
				</Typography>
			</View>
		</View>
	);
};

export const AccountScreen = () => {
	const { account } = useAuth();
	const headerHeight = useHeaderHeight();
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			testID='account-screen'
		>
			<View style={{ paddingTop: headerHeight }}>
				{account ? (
					<AccountDetails
						key={account.userId}
						account={account}
					/>
				) : (
					<Typography>Sign in to view your account.</Typography>
				)}
			</View>
		</TurndownScrollScreen>
	);
};
