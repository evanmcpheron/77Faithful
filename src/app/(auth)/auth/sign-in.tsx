import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { useAuth } from '@/auth/auth-provider';
import { useAuthAction } from '@/auth/use-auth-action';
import { emailError } from '@/auth/validation';
import { Button } from '@/components/button';
import { InlineNotice } from '@/components/inline-notice';
import { PasswordField } from '@/components/password-field';
import { TextField } from '@/components/text-field';
import { authAvailable, signInParticipant } from '@/services/auth';

import { EmptyState } from '@/components/empty-state';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextLink } from '@/components/text-link';

export default function SignInScreen() {
  const { refresh } = useAuth();
  const { pending, error, run } = useAuthAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const passwordInput = useRef<TextInput>(null);
  const busy = pending !== null;

  async function submit() {
    setSubmitted(true);
    if (emailError(email) || !password) return;
    await run('submit', async () => {
      const result = await signInParticipant(email.trim(), password);
      setPassword('');
      if (result === 'resetPassword') router.push('/auth/forgot-password');
      else await refresh();
    });
  }

  return (
    <ScreenScrollView>
      <ScreenHeading title="Sign In" description="Return to your personal 77-day journey." />
      {authAvailable ? (
        <ScreenSection>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            disabled={busy}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordInput.current?.focus()}
            error={submitted ? emailError(email) : undefined}
          />
          <PasswordField
            ref={passwordInput}
            label="Password"
            value={password}
            onChangeText={setPassword}
            autoComplete="current-password"
            returnKeyType="done"
            onSubmitEditing={submit}
            disabled={busy}
            error={submitted && !password ? 'Enter your password.' : undefined}
          />
          {error ? <InlineNotice tone="error" message={error.message} /> : null}
          <Button onPress={submit} loading={busy} loadingLabel="Signing in…">
            Sign In
          </Button>
        </ScreenSection>
      ) : (
        <EmptyState
          title="Authentication is available in the mobile app"
          description="This web preview does not sign in or collect credentials."
        />
      )}
      <ScreenSection>
        <Link href="/auth/forgot-password" push asChild>
          <TextLink disabled={busy}>Forgot password</TextLink>
        </Link>
        <Link href="/auth/sign-up" replace asChild>
          <TextLink disabled={busy}>Create account</TextLink>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
