import { HeaderTopRow } from '@td/components/ui/main-header/components/header-top-row/header-top-row.component';
import type { IHeaderTopRowProps } from '@td/components/ui/main-header/components/header-top-row/header-top-row.types';
import { useHeaderScroll } from '@td/providers/header-scroll/header-scroll.hook';
import { HeaderScrollProvider } from '@td/providers/header-scroll/header-scroll.provider';
import { Stack, useRouter } from 'expo-router';

export const unstable_settings = { initialRouteName: 'index' };

const ConnectedHeaderTopRow = (props: IHeaderTopRowProps) => {
	const { scrollOffset } = useHeaderScroll();
	return (
		<HeaderTopRow
			{...props}
			scrollOffset={scrollOffset}
		/>
	);
};

const SettingsLayout = () => {
	const router = useRouter();
	return (
		<HeaderScrollProvider>
			<Stack
				initialRouteName='index'
				screenOptions={{ headerShown: false }}
			>
				<Stack.Screen name='index' />
				<Stack.Screen
					name='progress-sharing'
					options={{
						headerShown: true,
						headerTransparent: true,
						headerShadowVisible: false,
						header: () => (
							<ConnectedHeaderTopRow
								canGoBack
								title='Progress sharing'
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
					name='blocked-members'
					options={{
						headerShown: true,
						headerTransparent: true,
						headerShadowVisible: false,
						header: () => (
							<ConnectedHeaderTopRow
								canGoBack
								showNotifications={false}
								title='Blocked members'
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
					name='shared-contributions'
					options={{
						headerShown: true,
						headerTransparent: true,
						headerShadowVisible: false,
						header: () => (
							<ConnectedHeaderTopRow
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
		</HeaderScrollProvider>
	);
};

export default SettingsLayout;
