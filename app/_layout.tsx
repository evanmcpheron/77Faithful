import { JourneyAccessProvider } from '@td/providers/journey/journey-access.provider';
import type { ComponentType } from 'react';
import { useEffect } from 'react';
import {
	initialWindowMetrics,
	SafeAreaProvider,
} from 'react-native-safe-area-context';

import { NotoSansTC_400Regular } from '@expo-google-fonts/noto-sans-tc/400Regular';
import { NotoSansTC_500Medium } from '@expo-google-fonts/noto-sans-tc/500Medium';
import { NotoSansTC_600SemiBold } from '@expo-google-fonts/noto-sans-tc/600SemiBold';
import { NotoSansTC_700Bold } from '@expo-google-fonts/noto-sans-tc/700Bold';
import { useFonts } from '@expo-google-fonts/noto-sans-tc/useFonts';
import * as SplashScreen from 'expo-splash-screen';

import { StyledRootGestureContainer } from '@td/components/layout/root/root-layout.styles';
import { NotificationHost } from '@td/components/ui/notification/notification-host.component';
import { RootNavigator } from '@td/navigation/root-navigator.component';
import { AuthProvider } from '@td/providers/auth/auth.provider';

const storybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true';

const getStorybookRoot = (): ComponentType => {
	const storybookModule = require('../.rnstorybook') as {
		default: ComponentType;
	};

	return storybookModule.default;
};

const StorybookRoot = storybookEnabled ? getStorybookRoot() : null;

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
	const [fontsLoaded] = useFonts({
		NotoSansTC_400Regular,
		NotoSansTC_500Medium,
		NotoSansTC_600SemiBold,
		NotoSansTC_700Bold,
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		return null;
	}

	if (StorybookRoot) {
		return (
			<SafeAreaProvider initialMetrics={initialWindowMetrics}>
				<StyledRootGestureContainer>
					<StorybookRoot />
				</StyledRootGestureContainer>
			</SafeAreaProvider>
		);
	}

	return (
		<SafeAreaProvider initialMetrics={initialWindowMetrics}>
			<StyledRootGestureContainer>
				<AuthProvider>
					<JourneyAccessProvider>
						<RootNavigator />
					</JourneyAccessProvider>
					<NotificationHost />
				</AuthProvider>
			</StyledRootGestureContainer>
		</SafeAreaProvider>
	);
};

export default RootLayout;
