import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function VerifyEmailScreen() {
  return (
    <NavigationPlaceholder
      title="Verify Email"
      description="Email verification is not connected yet. No verification request was made, no email was sent, and this scaffold does not assume that an account exists or verification is complete.">
      <PlaceholderLink href="/auth/welcome" dismissTo>
        Cancel and return to Welcome
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
