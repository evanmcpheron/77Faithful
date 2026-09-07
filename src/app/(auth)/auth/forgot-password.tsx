import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function ForgotPasswordScreen() {
  return (
    <NavigationPlaceholder
      title="Forgot Password"
      description="Password reset navigation preview. No reset email will be sent.">
      <PlaceholderLink href="/auth/sign-in" dismissTo>
        Return to Sign In
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
