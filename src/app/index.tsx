import { Redirect } from 'expo-router';

export default function BootstrapScreen() {
  // Replace this launch decision with restored auth/onboarding state when Firebase is integrated.
  return <Redirect href="/auth/welcome" />;
}
