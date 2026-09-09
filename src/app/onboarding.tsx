import { Redirect } from 'expo-router';

import { JourneySetupScreen } from '@77/features/journey-setup/journey-setup-screen.component';
import { useAuth } from '@77/providers/auth-provider';

const OnboardingScreen = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect href="/sign-in" />;
  if (!user.emailVerified) return <Redirect href="/confirm-email" />;

  return <JourneySetupScreen key={user.uid} userId={user.uid} />;
};

export default OnboardingScreen;
