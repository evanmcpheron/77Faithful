import { getAuthRouteRedirect } from '@td/navigation/auth-route-access';
import { useAuth } from '@td/providers/auth/auth.hook';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { KeyboardAvoidingView, StatusBar, View } from 'react-native';
import Animated, {
	interpolate,
	useAnimatedRef,
	useAnimatedStyle,
	useScrollOffset,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Layout } from '@td/theme/layout';

import { IconButtonVariant } from '@td/components/ui/icon-button/icon-button.types';
import {
	AuthScrollContentStyle,
	StyledAuthBodyContainer,
	StyledAuthHeaderContainer,
	StyledAuthHeaderContent,
	StyledAuthHeaderSafeArea,
	StyledAuthHeaderSvg,
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
	const redirect = getAuthRouteRedirect(account, pathname, isProfileReady);

	const showBackButton =
		pathname === '/forgot-password' || pathname === '/reset-password';

	const headerAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					translateY: interpolate(
						scrollOffset.value,
						[-Layout.AuthHeaderHeight, 0, Layout.AuthHeaderHeight],
						[
							-Layout.AuthHeaderHeight / 2,
							0,
							Layout.AuthHeaderHeight * 0.75,
						],
					),
				},
				{
					scale: interpolate(
						scrollOffset.value,
						[-Layout.AuthHeaderHeight, 0, Layout.AuthHeaderHeight],
						[2, 1, 1],
					),
				},
			],
		};
	});

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
						<StyledAuthHeaderSvg
							width='100%'
							height='100%'
							preserveAspectRatio='xMidYMid slice'
						/>

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
