import { HeaderTopRow } from '@td/components/ui/main-header/components/header-top-row/header-top-row.component';
import { Stack, useRouter } from 'expo-router';

export const unstable_settings = { initialRouteName: 'journey' };

const JourneyLayout = () => {
	const router = useRouter();
	return (
		<Stack
			initialRouteName='journey'
			screenOptions={{ headerShown: false }}
		>
			<Stack.Screen name='journey' />
			<Stack.Screen
				name='reflections'
				options={{
					headerShown: true,
					headerShadowVisible: false,
					headerTransparent: true,
					headerStyle: { backgroundColor: 'transparent' },
					header: () => (
						<HeaderTopRow
							canGoBack
							title='Reflections'
							showNotifications={false}
							onBackPress={() =>
								router.canGoBack()
									? router.back()
									: router.replace('/journey')
							}
						/>
					),
				}}
			/>
		</Stack>
	);
};

export default JourneyLayout;
