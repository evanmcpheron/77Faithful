import { useAuth } from '@/auth/auth-provider';
import { useAuthAction } from '@/auth/use-auth-action';
import { Button } from '@/components/button';
import { InlineNotice } from '@/components/inline-notice';
import { ScreenSection } from '@/components/screen-section';
import { signOutParticipant } from '@/services/auth';

export function SignOutAction() {
  const { refresh } = useAuth();
  const { pending, error, run } = useAuthAction();

  return (
    <ScreenSection>
      {error ? <InlineNotice tone="error" message={error.message} /> : null}
      <Button
        variant="secondary"
        loading={pending === 'exit'}
        loadingLabel="Signing out…"
        onPress={() =>
          run('exit', async () => {
            await signOutParticipant();
            await refresh();
          })
        }>
        Sign Out
      </Button>
    </ScreenSection>
  );
}
