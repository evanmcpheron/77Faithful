import { ErrorState } from '@td/components/ui/error-state/error-state.component';
import { LoadingState } from '@td/components/ui/loading-state/loading-state.component';
import { HeaderTopRow } from '@td/components/ui/main-header/components/header-top-row/header-top-row.component';
import { useCommunitySafetyReviewAccess } from '@td/features/communities/use-community-safety-review-access.hook';
import { Redirect, Stack, useRouter } from 'expo-router';

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
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name='dashboard/index' />
			<Stack.Screen
				name='safety-reports/index'
				options={{
					headerShown: true,
					headerTransparent: true,
					headerShadowVisible: false,
					header: () => (
						<HeaderTopRow
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
		</Stack>
	);
};

export default AdminLayout;
