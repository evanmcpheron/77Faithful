import { ErrorState } from '@td/components/ui/error-state/error-state.component';
import { LoadingState } from '@td/components/ui/loading-state/loading-state.component';
import { HeaderTopRow } from '@td/components/ui/main-header/components/header-top-row/header-top-row.component';
import type { IHeaderTopRowProps } from '@td/components/ui/main-header/components/header-top-row/header-top-row.types';
import { useCommunitySafetyReviewAccess } from '@td/features/communities/use-community-safety-review-access.hook';
import { useHeaderScroll } from '@td/providers/header-scroll/header-scroll.hook';
import { HeaderScrollProvider } from '@td/providers/header-scroll/header-scroll.provider';
import { Redirect, Stack, useRouter } from 'expo-router';

const ConnectedHeaderTopRow = (props: IHeaderTopRowProps) => {
	const { scrollOffset } = useHeaderScroll();
	return (
		<HeaderTopRow
			{...props}
			scrollOffset={scrollOffset}
		/>
	);
};

const AdminLayout = () => {
	const router = useRouter();
	const { status, retry } = useCommunitySafetyReviewAccess();
	if (status === 'Loading')
		return <LoadingState label='Checking safety review access…' />;
	if (status === 'Error')
		return (
			<ErrorState
				title='Unable to check review access'
				message='Check your connection and try again.'
				onRetry={() => void retry()}
			/>
		);
	if (status === 'Denied') return <Redirect href='/settings' />;
	return (
		<HeaderScrollProvider>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name='dashboard/index' />
				<Stack.Screen
					name='safety-reports/index'
					options={{
						headerShown: true,
						headerTransparent: true,
						headerShadowVisible: false,
						header: () => (
							<ConnectedHeaderTopRow
								canGoBack
								showNotifications={false}
								title='Safety reports'
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
					name='safety-reports/[reportId]'
					options={{
						headerShown: true,
						headerTransparent: true,
						headerShadowVisible: false,
						header: () => (
							<ConnectedHeaderTopRow
								canGoBack
								showNotifications={false}
								title='Review report'
								onBackPress={() =>
									router.canGoBack()
										? router.back()
										: router.replace('/safety-reports')
								}
							/>
						),
					}}
				/>
			</Stack>
		</HeaderScrollProvider>
	);
};

export default AdminLayout;
