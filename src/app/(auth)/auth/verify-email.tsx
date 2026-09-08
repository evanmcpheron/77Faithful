import { useState } from 'react';

import { useAuth } from '@/auth/auth-provider';
import { useAuthAction } from '@/auth/use-auth-action';
import { Button } from '@/components/button';
import { InlineNotice } from '@/components/inline-notice';
import { ScreenHeading } from '@/components/screen-heading';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { ScreenSection } from '@/components/screen-section';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import {
  cancelSignUp,
  confirmEmail,
  refreshEmailVerification,
  resendEmailCode,
  signOutParticipant,
} from '@/services/auth';

export default function VerifyEmailScreen() {
  const { state, refresh } = useAuth();
  const action = useAuthAction();
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<string>();
  if (state.status !== 'confirmationPending' && state.status !== 'unverified') return null;
  const mode = state.status === 'confirmationPending' ? 'registration' : 'attribute';
  const email = state.status === 'confirmationPending' ? state.email : state.participant.email;
  const busy = action.pending !== null;

  async function checkVerification() {
    await refreshEmailVerification();
    await refresh();
    setNotice('Your email is still unverified. Check again or request another code.');
  }

  function submit() {
    setSubmitted(true);
    if (!code.trim()) return;
    void action.run('submit', async () => {
      setNotice(undefined);
      await confirmEmail(mode, code.trim());
      setCode('');
      setSubmitted(false);
      if (mode === 'registration') await refresh('/auth/sign-in');
      else await checkVerification();
    });
  }

  return (
    <ScreenScrollView>
      <ScreenHeading
        title="Verify Email"
        description={
          mode === 'registration'
            ? 'Enter the code from your confirmation email. After confirming, sign in to continue.'
            : 'Verify your email before continuing. Request a code if you need one.'
        }
      />
      {email ? <ThemedText>{email}</ThemedText> : null}
      <ScreenSection>
        <TextField
          label="Confirmation code"
          value={code}
          onChangeText={setCode}
          disabled={busy}
          autoComplete="one-time-code"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={submit}
          error={submitted && !code.trim() ? 'Enter the confirmation code.' : undefined}
        />
        {action.error ? <InlineNotice tone="error" message={action.error.message} /> : null}
        {notice ? <InlineNotice message={notice} /> : null}
        <Button
          onPress={submit}
          disabled={busy}
          loading={action.pending === 'submit'}
          loadingLabel="Verifying…">
          Verify email
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          loading={action.pending === 'resend'}
          loadingLabel="Sending code…"
          onPress={() =>
            action.run('resend', async () => {
              setNotice(undefined);
              await resendEmailCode(mode);
              setNotice('Another confirmation code has been sent. Check your email.');
            })
          }>
          Resend code
        </Button>
        {mode === 'attribute' ? (
          <Button
            variant="secondary"
            disabled={busy}
            loading={action.pending === 'refresh'}
            loadingLabel="Checking…"
            onPress={() => action.run('refresh', checkVerification)}>
            Check verification
          </Button>
        ) : null}
      </ScreenSection>
      <Button
        variant="tertiary"
        disabled={busy}
        loading={action.pending === 'exit'}
        loadingLabel="Leaving…"
        onPress={() =>
          action.run('exit', async () => {
            if (mode === 'registration') await cancelSignUp();
            else await signOutParticipant();
            await refresh();
          })
        }>
        {mode === 'registration' ? 'Cancel and return to Welcome' : 'Sign Out'}
      </Button>
    </ScreenScrollView>
  );
}
