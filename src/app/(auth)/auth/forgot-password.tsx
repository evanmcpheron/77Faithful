import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { useAuthAction } from '@/auth/use-auth-action';
import { emailError } from '@/auth/validation';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { InlineNotice } from '@/components/inline-notice';
import { PasswordField } from '@/components/password-field';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextField } from '@/components/text-field';
import { TextLink } from '@/components/text-link';
import {
  authAvailable,
  completePasswordReset,
  passwordRequirements,
  requestPasswordReset,
} from '@/services/auth';

export default function ForgotPasswordScreen() {
  const { pending, error, run } = useAuthAction();
  const [phase, setPhase] = useState<'request' | 'confirm' | 'complete'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<string>();
  const passwordInput = useRef<TextInput>(null);
  const busy = pending !== null;

  async function request() {
    setSubmitted(true);
    if (emailError(email)) return;
    await run('submit', async () => {
      await requestPasswordReset(email.trim());
      setEmail(email.trim());
      setSubmitted(false);
      setPhase('confirm');
      setNotice('If recovery is available for this email, check your inbox for a reset code.');
    });
  }

  async function confirm() {
    setSubmitted(true);
    if (!code.trim() || !password) return;
    await run('submit', async () => {
      await completePasswordReset(email, code.trim(), password);
      setCode('');
      setPassword('');
      setNotice(undefined);
      setPhase('complete');
    });
  }

  async function resend() {
    setNotice(undefined);
    await run('resend', async () => {
      await requestPasswordReset(email);
      setNotice('A new reset code was requested. If recovery is available, check your email.');
    });
  }

  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Forgot Password"
        description="Recover access to your account by email."
      />
      {!authAvailable ? (
        <EmptyState
          title="Authentication is available in the mobile app"
          description="This web preview does not request recovery emails or reset passwords."
        />
      ) : phase === 'complete' ? (
        <InlineNotice message="Your password has been reset. You can sign in with your new password." />
      ) : (
        <ScreenSection>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            disabled={busy || phase === 'confirm'}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={phase === 'request' ? request : undefined}
            error={submitted && phase === 'request' ? emailError(email) : undefined}
          />
          {notice ? <InlineNotice message={notice} /> : null}
          {phase === 'confirm' ? (
            <>
              <TextField
                label="Reset code"
                value={code}
                onChangeText={setCode}
                disabled={busy}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordInput.current?.focus()}
                error={submitted && !code.trim() ? 'Enter the reset code.' : undefined}
              />
              <PasswordField
                ref={passwordInput}
                label="New password"
                value={password}
                onChangeText={setPassword}
                disabled={busy}
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={confirm}
                helperText={passwordRequirements()}
                error={submitted && !password ? 'Enter a new password.' : undefined}
              />
            </>
          ) : null}
          {error ? <InlineNotice tone="error" message={error.message} /> : null}
          <Button
            onPress={phase === 'request' ? request : confirm}
            disabled={busy}
            loading={pending === 'submit'}
            loadingLabel={phase === 'request' ? 'Requesting reset code…' : 'Resetting password…'}>
            {phase === 'request' ? 'Send reset email' : 'Reset password'}
          </Button>
          {phase === 'confirm' ? (
            <Button
              variant="secondary"
              onPress={resend}
              disabled={busy}
              loading={pending === 'resend'}
              loadingLabel="Requesting another code…">
              Resend reset code
            </Button>
          ) : null}
        </ScreenSection>
      )}
      <ScreenSection>
        <Link href="/auth/sign-in" dismissTo asChild>
          <TextLink disabled={busy}>Back to Sign In</TextLink>
        </Link>
      </ScreenSection>
    </ScreenScrollView>
  );
}
