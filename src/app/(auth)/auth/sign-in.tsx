import { NavigationPlaceholder, PlaceholderLink } from '@/components/navigation-placeholder';

export default function SignInScreen() {
  return (
    <NavigationPlaceholder
      title="Sign In"
      description="Sign-in navigation preview. Authentication is not connected yet.">
      <PlaceholderLink href="/auth/forgot-password" push>
        Forgot password
      </PlaceholderLink>
      <PlaceholderLink href="/auth/sign-up" replace>
        Create account
      </PlaceholderLink>
    </NavigationPlaceholder>
  );
}
