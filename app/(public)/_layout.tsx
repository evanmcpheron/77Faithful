import { Stack, useRouter } from 'expo-router';

import { HeaderTopRow } from '@td/components/ui/main-header/components/header-top-row/header-top-row.component';
import { SurfaceColors } from '@td/theme/colors';

const PublicLayout = () => {
	const router = useRouter();
	const informationOptions = (title: string, fallback: '/about' | '/') => ({
		headerShown: true,
		headerShadowVisible: false,
		headerStyle: { backgroundColor: SurfaceColors.Screen },
		headerBackVisible: false,
		header: () => (
			<HeaderTopRow
				canGoBack
				title={title}
				showNotifications={false}
				onBackPress={() =>
					router.canGoBack()
						? router.back()
						: router.replace(fallback)
				}
			/>
		),
	});
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen
				name='about'
				options={informationOptions('About 77Faithful', '/')}
			/>
			<Stack.Screen
				name='support'
				options={{
					...informationOptions('Support 77Faithful', '/about'),
					headerTransparent: true,
					headerStyle: { backgroundColor: 'transparent' },
				}}
			/>
		</Stack>
	);
};

export default PublicLayout;
