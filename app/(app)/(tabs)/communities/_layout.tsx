import { HeaderTopRow } from '@td/components/ui/main-header/components/header-top-row/header-top-row.component';
import type { IHeaderTopRowProps } from '@td/components/ui/main-header/components/header-top-row/header-top-row.types';
import { useHeaderScroll } from '@td/providers/header-scroll/header-scroll.hook';
import { HeaderScrollProvider } from '@td/providers/header-scroll/header-scroll.provider';
import { SurfaceColors } from '@td/theme/colors';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

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

const InvitePeopleHeader = () => {
	const router = useRouter();
	const { communityId } = useLocalSearchParams<{ communityId?: string }>();
	return (
		<ConnectedHeaderTopRow
			canGoBack
			title='Invite people'
			showNotifications={false}
			onBackPress={() => {
				if (router.canGoBack()) {
					router.back();
					return;
				}
				if (!communityId) {
					router.replace('/communities');
					return;
				}
				router.replace({
					pathname: '/communities/[communityId]',
					params: { communityId },
				});
			}}
		/>
	);
};

const CommunitiesLayout = () => {
	const router = useRouter();
	return (
		<HeaderScrollProvider>
			<Stack
				initialRouteName='index'
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: SurfaceColors.Screen },
				}}
			>
				<Stack.Screen name='index' />
				<Stack.Screen
					name='join'
					options={{
						headerShown: true,
						headerBackVisible: false,
						headerTransparent: true,
						headerShadowVisible: false,
						headerStyle: { backgroundColor: 'transparent' },
						header: () => (
							<ConnectedHeaderTopRow
								canGoBack
								title='Join community'
								showNotifications={false}
								onBackPress={() =>
									router.canGoBack()
										? router.back()
										: router.replace('/communities')
								}
							/>
						),
					}}
				/>
				<Stack.Screen
					name='[communityId]/index'
					options={{
						headerShown: true,
						headerBackVisible: false,
						headerTransparent: true,
						headerShadowVisible: false,
						headerStyle: { backgroundColor: 'transparent' },
						header: () => (
							<ConnectedHeaderTopRow
								canGoBack
								title='Community'
								showNotifications={false}
								onBackPress={() =>
									router.canGoBack()
										? router.back()
										: router.replace('/communities')
								}
							/>
						),
					}}
				/>
				<Stack.Screen
					name='[communityId]/invite'
					options={{
						headerShown: true,
						headerBackVisible: false,
						headerTransparent: true,
						headerShadowVisible: false,
						headerStyle: { backgroundColor: 'transparent' },
						header: () => <InvitePeopleHeader />,
					}}
				/>
			</Stack>
		</HeaderScrollProvider>
	);
};

export default CommunitiesLayout;
