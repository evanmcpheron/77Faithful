import { Redirect } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/auth/auth-provider';
import { postAuthDestination } from '@/auth/participant-stage';
import { ErrorState } from '@/components/error-state';
import { LoadingPlaceholder } from '@/components/loading-placeholder';
import { ScreenScrollView } from '@/components/screen-scroll-view';

export default function BootstrapScreen() {
  const { state, participantStage, signedOutDestination, refresh } = useAuth();
  const [retrying, setRetrying] = useState(false);
  if (state.status === 'signedOut') return <Redirect href={signedOutDestination} />;
  if (state.status === 'confirmationPending' || state.status === 'unverified') {
    return <Redirect href="/auth/verify-email" />;
  }
  if (state.status === 'verified') {
    const destination = postAuthDestination(participantStage);
    if (destination) return <Redirect href={destination} />;
  }
  const error =
    state.status === 'restoreError'
      ? state.error.message
      : participantStage.status === 'error'
        ? 'We could not load your onboarding progress.'
        : null;
  return (
    <ScreenScrollView headerless>
      {error ? (
        <ErrorState
          message={error}
          retrying={retrying}
          onRetry={async () => {
            if (retrying) return;
            setRetrying(true);
            await refresh();
            setRetrying(false);
          }}
        />
      ) : (
        <LoadingPlaceholder label="Restoring your account…" />
      )}
    </ScreenScrollView>
  );
}
