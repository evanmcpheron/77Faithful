import { Redirect } from 'expo-router';

export default function BootstrapScreen() {
  // Connect this launch decision to restored auth/onboarding state when Amplify Auth is integrated.
  return <Redirect href="/auth/welcome" />;
}
