import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { useAuth } from '@/auth/auth-provider';
import { authError } from '@/auth/errors';
import { emailError } from '@/auth/validation';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { InlineNotice } from '@/components/inline-notice';
import { PasswordField } from '@/components/password-field';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextLink } from '@/components/text-link';
import { TextField } from '@/components/text-field';
import { authAvailable, createAccount, passwordRequirements } from '@/services/auth';

export default function SignUpScreen() {
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const inFlight = useRef(false);
  const passwordInput = useRef<TextInput>(null);

  async function submit() {
    if (inFlight.current) return;
    setSubmitted(true);
    if (emailError(email) || !password) return;
    inFlight.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await createAccount(email.trim(), password);
      setPassword('');
      await refresh();
    } catch (error) {
      setError(authError(error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <ScreenScrollView>
      <ScreenHeading title="Sign Up" description="Create an account for your personal journey." />
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
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={submit}
            disabled={busy}
            helperText={passwordRequirements()}
            error={submitted && !password ? 'Enter a password.' : undefined}
          />
          {error ? <InlineNotice tone="error" message={error} /> : null}
          <Button onPress={submit} loading={busy} loadingLabel="Creating account…">
            Create Account
          </Button>
        </ScreenSection>
      ) : (
        <EmptyState
          title="Authentication is available in the mobile app"
          description="This web preview does not create accounts or collect credentials."
        />
      )}
      <ScreenSection>
        <Link href="/auth/sign-in" replace asChild>
          <TextLink disabled={busy}>Existing account? Sign In</TextLink>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
