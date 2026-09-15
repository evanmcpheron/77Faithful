import { HeaderTopRow } from '@td/components/ui/main-header/components/header-top-row/header-top-row.component';
import { Stack, useRouter } from 'expo-router';

export const unstable_settings = { initialRouteName: 'index' };

const SettingsLayout = () => {
	const router = useRouter();
	return (
		<Stack
			initialRouteName='index'
			screenOptions={{ headerShown: false }}
		>
			<Stack.Screen name='index' />
			<Stack.Screen
				name='shared-contributions'
				options={{
					headerShown: true,
					headerTransparent: true,
					headerShadowVisible: false,
					header: () => (
						<HeaderTopRow
							canGoBack
							showNotifications={false}
							title='Shared Contributions'
							onBackPress={() =>
								router.canGoBack()
									? router.back()
									: router.replace('/settings')
							}
						/>
					),
				}}
			/>
			<Stack.Screen
				name='practices'
				options={{
					headerShown: true,
					headerTransparent: true,
					headerShadowVisible: false,
					headerStyle: { backgroundColor: 'transparent' },
					header: () => (
						<HeaderTopRow
							canGoBack
							title='Practices'
							showNotifications={false}
							onBackPress={() =>
								router.canGoBack()
									? router.back()
									: router.replace('/settings')
							}
						/>
					),
				}}
			/>
			<Stack.Screen
				name='account/index'
				options={{
					headerShown: true,
					headerTransparent: true,
					headerShadowVisible: false,
					headerStyle: { backgroundColor: 'transparent' },
					header: () => (
						<HeaderTopRow
							canGoBack
							title='Account'
							showNotifications={false}
							onBackPress={() =>
								router.canGoBack()
									? router.back()
									: router.replace('/settings')
							}
						/>
					),
				}}
			/>
		</Stack>
	);
};

export default SettingsLayout;
