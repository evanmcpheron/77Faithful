import { getAuthRouteRedirect } from '@td/navigation/auth-route-access';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useJourneyAccess } from '@td/providers/journey/journey-access.provider';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { KeyboardAvoidingView, StatusBar, View } from 'react-native';
import Animated, {
	useAnimatedRef,
	useScrollOffset,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Layout } from '@td/theme/layout';

import { IconButtonVariant } from '@td/components/ui/icon-button/icon-button.types';
import { AuthHeaderBackground } from '@td/features/auth/components/auth-header.component';
import { useAuthHeaderAnimation } from '@td/features/auth/hooks/use-auth-header-animation.hook';
import {
	AuthScrollContentStyle,
	StyledAuthBodyContainer,
	StyledAuthHeaderContainer,
	StyledAuthHeaderContent,
	StyledAuthHeaderSafeArea,
	StyledAuthScreen,
	StyledAuthScrollView,
} from '@td/features/auth/screens/auth.styles';
import { IconSizes, IconStrokeWidths } from '@td/theme/icon-sizes';
import { ZIndex } from '@td/theme/z-index';
import { Platform } from 'react-native';

const AuthLayout = () => {
	const scrollRef = useAnimatedRef<Animated.ScrollView>();
	const scrollOffset = useScrollOffset(scrollRef);
	const insets = useSafeAreaInsets();
	const pathname = usePathname();
	const router = useRouter();
	const { account, isProfileReady } = useAuth();
	const { hasJourney } = useJourneyAccess();
	const redirect = getAuthRouteRedirect(
		account,
		pathname,
		isProfileReady,
		hasJourney,
	);

	const showBackButton =
		pathname === '/forgot-password' || pathname === '/reset-password';

	const headerAnimatedStyle = useAuthHeaderAnimation(
		scrollOffset,
		Layout.AuthHeaderHeight,
	);

	if (redirect) return <Redirect href={redirect} />;

	return (
		<StyledAuthScreen>
			<StatusBar barStyle='light-content' />
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<StyledAuthScrollView
					ref={scrollRef}
					contentContainerStyle={AuthScrollContentStyle}
					scrollEventThrottle={16}
					showsVerticalScrollIndicator={false}
				>
					<StyledAuthHeaderContainer style={headerAnimatedStyle}>
						<AuthHeaderBackground />

						<StyledAuthHeaderSafeArea edges={['top']}>
							<StyledAuthHeaderContent
								style={{ marginTop: -insets.top }}
							>
								{showBackButton && (
									<View
										style={{
											position: 'absolute',
											left: 16,
											top: insets.top,
											zIndex: ZIndex.Overlay,
										}}
									>
										<IconButton
											name={IconName.ArrowLeft}
											hasBackground
											variant={IconButtonVariant.Ghost}
											strokeWidth={
												IconStrokeWidths.Regular
											}
											accessibilityLabel='Go back'
											onPress={() => {
												router.back();
											}}
										/>
									</View>
								)}
								<AppIcon
									name={IconName.LightLogo}
									size={IconSizes.Huge}
								/>
							</StyledAuthHeaderContent>
						</StyledAuthHeaderSafeArea>
					</StyledAuthHeaderContainer>

					<StyledAuthBodyContainer>
						<Slot />
					</StyledAuthBodyContainer>
				</StyledAuthScrollView>
			</KeyboardAvoidingView>
		</StyledAuthScreen>
	);
};

export default AuthLayout;
