import { StackContentStyle } from '@td/components/layout/root/root-layout.styles';
import { ErrorState } from '@td/components/ui/error-state/error-state.component';
import { LoadingState } from '@td/components/ui/loading-state/loading-state.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useJourneyAccess } from '@td/providers/journey/journey-access.provider';
import { Stack } from 'expo-router';

export const RootNavigator = () => {
	const journeyAccess = useJourneyAccess();
	const { account, isInitializing, initializationError, isProfileReady } =
		useAuth();
	const isVerified = account?.isEmailConfirmed === true && isProfileReady;

	// Do not mount routes until persistence has resolved; deep links must not flash private screens.
	if (isInitializing) return <LoadingState label='Loading your account…' />;
	if (initializationError)
		return (
			<ErrorState
				title='Unable to load your account'
				message='Please close and reopen the app to try again.'
			/>
		);

	if (isVerified && journeyAccess.isLoading)
		return <LoadingState label='Loading your journey…' />;
	if (isVerified && journeyAccess.hasError)
		return (
			<ErrorState
				title='Unable to load your journey'
				message='Check your connection and try again.'
				onRetry={journeyAccess.retry}
			/>
		);

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
			<Stack.Protected guard={!isVerified}>
				<Stack.Screen name='(auth)' />
			</Stack.Protected>
			<Stack.Protected guard={isVerified && !journeyAccess.hasJourney}>
				<Stack.Screen name='onboarding' />
			</Stack.Protected>
			<Stack.Protected guard={isVerified && journeyAccess.hasJourney}>
				<Stack.Screen name='(app)' />
			</Stack.Protected>
			<Stack.Screen name='(public)' />
			<Stack.Screen name='+not-found' />
			<Stack.Protected guard={false}>
				<Stack.Screen name='(future)' />
				<Stack.Screen name='_sitemap' />
			</Stack.Protected>
			<Stack.Protected
				guard={process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true'}
			>
				<Stack.Screen name='(storybook)/storybook' />
			</Stack.Protected>
		</Stack>
	);
};
