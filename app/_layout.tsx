import type { ComponentType } from 'react';
import { useEffect, useRef } from 'react';
import {
	initialWindowMetrics,
	SafeAreaProvider,
} from 'react-native-safe-area-context';

import { NotoSansTC_400Regular } from '@expo-google-fonts/noto-sans-tc/400Regular';
import { NotoSansTC_500Medium } from '@expo-google-fonts/noto-sans-tc/500Medium';
import { NotoSansTC_600SemiBold } from '@expo-google-fonts/noto-sans-tc/600SemiBold';
import { NotoSansTC_700Bold } from '@expo-google-fonts/noto-sans-tc/700Bold';
import { useFonts } from '@expo-google-fonts/noto-sans-tc/useFonts';
import {
	Stack,
	usePathname,
	useRootNavigationState,
	useRouter,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { useAuth } from '@td/providers/auth/auth.hook';
import { AuthProvider } from '@td/providers/auth/auth.provider';

import {
	StackContentStyle,
	StyledRootGestureContainer,
} from '@td/components/layout/root/root-layout.styles';
import { NotificationHost } from '@td/components/ui/notification/notification-host.component';

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
		if (fontsLoaded && storybookEnabled) {
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
		<AuthProvider>
			<SafeAreaProvider initialMetrics={initialWindowMetrics}>
				<StyledRootGestureContainer>
					<StackLayout />
					<NotificationHost />
				</StyledRootGestureContainer>
			</SafeAreaProvider>
		</AuthProvider>
	);
};

const StackLayout = () => {
	const { isAuthenticated, isInitializingSession } = useAuth();
	const pathname = usePathname();
	const router = useRouter();
	const navigationState = useRootNavigationState();
	const hasResolvedInitialSession = useRef(false);

	useEffect(() => {
		if (isInitializingSession || !navigationState?.key) {
			return;
		}

		SplashScreen.hideAsync();

		if (hasResolvedInitialSession.current) {
			return;
		}

		hasResolvedInitialSession.current = true;

		if (isAuthenticated && pathname === '/') {
			router.replace('/today');
		}
	}, [
		isAuthenticated,
		isInitializingSession,
		navigationState?.key,
		pathname,
		router,
	]);

	if (isInitializingSession) {
		return null;
	}

	return (
		<Stack
			screenOptions={{
				contentStyle: StackContentStyle,
				headerBackVisible: false,
				animation: 'none',
				headerShown: false,
				headerStyle: { backgroundColor: 'transparent' },
			}}
		>
			<Stack.Screen name='(auth)' />
			<Stack.Protected guard={false}>
				<Stack.Screen name='(future)' />
				<Stack.Screen name='_sitemap' />
			</Stack.Protected>
			<Stack.Protected guard={storybookEnabled}>
				<Stack.Screen name='(storybook)/storybook' />
			</Stack.Protected>
		</Stack>
	);
};

export default RootLayout;
