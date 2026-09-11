import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
} from 'react-native-reanimated';

import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { NavigationActionList } from '@td/components/ui/navigation-action-list/navigation-action-list.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { AuthHeaderBackground } from '@td/features/auth/components/auth-header.component';
import { useAuthHeaderAnimation } from '@td/features/auth/hooks/use-auth-header-animation.hook';
import {
	StyledAuthBodyContainer,
	StyledAuthHeaderContent,
	StyledAuthHeaderSafeArea,
} from '@td/features/auth/screens/auth.styles';
import { useAuth } from '@td/providers/auth/auth.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';

import { SETTINGS_PHOTO_HEIGHT, styles } from './settings.styles';

export const SettingsScreen = () => {
	const router = useRouter();
	const { account, signOut } = useAuth();
	const [isSigningOut, setIsSigningOut] = useState(false);
	const [signOutError, setSignOutError] = useState<string | null>(null);
	const [viewportHeight, setViewportHeight] = useState(0);
	const [headerHeight, setHeaderHeight] = useState(styles.header.minHeight);
	const scrollOffset = useSharedValue(0);
	const reduceMotion = useReducedMotion();
	const photoAnimatedStyle = useAuthHeaderAnimation(
		scrollOffset,
		SETTINGS_PHOTO_HEIGHT,
	);
	const titleAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: Math.min(scrollOffset.value, 0) }],
	}));

	const handleSignOut = async () => {
		if (isSigningOut) return;
		setIsSigningOut(true);
		setSignOutError(null);
		try {
			await signOut();
		} catch {
			setSignOutError('We could not sign you out. Please try again.');
		} finally {
			setIsSigningOut(false);
		}
	};

	return (
		<View
			style={styles.viewport}
			onLayout={({ nativeEvent }) =>
				setViewportHeight(nativeEvent.layout.height)
			}
		>
			<TurndownScrollScreen
				backgroundColor={SurfaceColors.Screen}
				contentBackgroundColor='transparent'
				contentPadding={0}
				bottomSpacing={0}
				safeAreaEdges={['left', 'right']}
				keyboardEnabled={false}
				scrollOffset={scrollOffset}
				testID='settings-screen'
				header={
					<View
						style={styles.header}
						onLayout={({ nativeEvent }) =>
							setHeaderHeight(nativeEvent.layout.height)
						}
					>
						<Animated.View
							pointerEvents='none'
							style={[
								styles.photo,
								!reduceMotion && photoAnimatedStyle,
							]}
						>
							<AuthHeaderBackground />
							<LinearGradient
								colors={[
									`${SurfaceColors.Screen}00`,
									SurfaceColors.Screen,
								]}
								style={styles.photoFade}
								accessible={false}
							/>
						</Animated.View>
						<View style={styles.headerContainer}>
							<StyledAuthHeaderSafeArea
								edges={['top', 'left', 'right']}
							>
								<StyledAuthHeaderContent
									style={styles.headerContent}
								>
									<Animated.View
										style={[
											styles.heading,
											titleAnimatedStyle,
										]}
									>
										<View accessibilityRole='header'>
											<Typography
												size='Display'
												tone='Inverse'
											>
												Settings
											</Typography>
										</View>
										<Typography
											tone='Inverse'
											weight='Regular'
										>
											Your account, your practices, and
											information about 77Faithful.
										</Typography>
									</Animated.View>
								</StyledAuthHeaderContent>
							</StyledAuthHeaderSafeArea>
						</View>
					</View>
				}
			>
				<StyledAuthBodyContainer
					style={[
						styles.body,
						{
							minHeight: Math.max(
								0,
								viewportHeight - headerHeight + Spacing.Large,
							),
						},
					]}
				>
					<View style={styles.content}>
						<View style={styles.section}>
							<Typography
								size='H1'
								weight='Semibold'
							>
								Your account
							</Typography>
							{account?.contactEmail && (
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									{account.contactEmail}
								</Typography>
							)}
							<NavigationActionList
								actions={{
									id: 'account',
									title: 'Account',
									iconName: IconName.Identification,
									onPress: () =>
										router.push('/settings/account'),
								}}
							/>
						</View>
						<View style={styles.section}>
							<Typography
								size='H1'
								weight='Semibold'
							>
								Your journey
							</Typography>
							<NavigationActionList
								actions={{
									id: 'practices',
									title: 'Practices',
									iconName: IconName.Note,
									onPress: () =>
										router.push('/settings/practices'),
								}}
							/>
							<Typography
								size='Body2'
								tone='Secondary'
								weight='Regular'
							>
								An incomplete day does not reset your journey.
							</Typography>
						</View>
						<View style={styles.section}>
							<Typography
								size='H1'
								weight='Semibold'
							>
								About 77Faithful
							</Typography>
							<NavigationActionList
								actions={[
									{
										id: 'about',
										title: 'About',
										iconName: IconName.Note,
										onPress: () => router.push('/about'),
									},
									{
										id: 'privacy',
										title: 'Privacy',
										iconName: IconName.Lock,
										onPress: () => router.push('/privacy'),
									},
									{
										id: 'scripture-acknowledgments',
										title: 'Acknowledgements',
										accessibilityLabel:
											'Scripture acknowledgements',
										iconName: IconName.Note,
										onPress: () =>
											router.push(
												'/scripture-acknowledgments',
											),
									},
								]}
							/>
							<NavigationActionList
								actions={{
									id: 'support',
									title: 'Support 77Faithful',
									iconName: IconName.Note,
									onPress: () => router.push('/support'),
								}}
							/>
							<Typography
								size='Body2'
								tone='Secondary'
								weight='Regular'
							>
								Help cover hosting costs. Giving is optional.
							</Typography>
						</View>
						<Typography
							size='Body2'
							tone='Muted'
							weight='Regular'
							align='center'
						>
							Centered on Christ. Always free. No advertising.
						</Typography>
						<View style={styles.section}>
							<TurndownButton
								variant='Solid'
								tone='Error'
								loading={isSigningOut}
								onPress={() => void handleSignOut()}
							>
								Sign out
							</TurndownButton>
							{signOutError && (
								<View accessibilityLiveRegion='polite'>
									<Typography tone='Error'>
										{signOutError}
									</Typography>
								</View>
							)}
						</View>
					</View>
				</StyledAuthBodyContainer>
			</TurndownScrollScreen>
		</View>
	);
};
