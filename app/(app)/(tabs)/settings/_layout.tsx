import { HeaderTopRow } from '@td/components/ui/main-header/components/header-top-row/header-top-row.component';
import { SurfaceColors } from '@td/theme/colors';
import { Stack, useRouter } from 'expo-router';

export const unstable_settings = { initialRouteName: 'index' };

const SettingsLayout = () => {
	const router = useRouter();
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen
				name='account/index'
				options={{
					headerShown: true,
					headerShadowVisible: false,
					headerStyle: { backgroundColor: SurfaceColors.Screen },
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
