import { JourneySetupScreen } from '@td/features/journey-setup/journey-setup-screen.component';
import { useAuth } from '@td/providers/auth/auth.hook';
export const OnboardingScreen = () => {
	const { account } = useAuth();
	return account ? (
		<JourneySetupScreen
			key={account.userId}
			userId={account.userId}
		/>
	) : null;
};
