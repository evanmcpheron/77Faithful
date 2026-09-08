import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { authError } from './errors';
import { getParticipantStage, type ParticipantStage } from './participant-stage';
import type { AuthState } from './types';

import { restoreAuth } from '@/services/auth';

type SignedOutDestination = '/auth/welcome' | '/auth/sign-in';
type AuthContextValue = {
  state: AuthState;
  participantStage: ParticipantStage;
  signedOutDestination: SignedOutDestination;
  refresh: (signedOutDestination?: SignedOutDestination) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function resolveAuthState(): Promise<AuthState> {
  try {
    return await restoreAuth();
  } catch (error) {
    return { status: 'restoreError', error: authError(error) };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{
    state: AuthState;
    signedOutDestination: SignedOutDestination;
  }>({ state: { status: 'restoring' }, signedOutDestination: '/auth/welcome' });
  const revision = useRef({ value: 0 });

  useEffect(() => {
    const requests = revision.current;
    const current = ++requests.value;
    void resolveAuthState().then((state) => {
      if (current === requests.value) setSession({ state, signedOutDestination: '/auth/welcome' });
    });
    return () => {
      requests.value++;
    };
  }, []);

  async function refresh(signedOutDestination: SignedOutDestination = '/auth/welcome') {
    const current = ++revision.current.value;
    const state = await resolveAuthState();
    if (current === revision.current.value) setSession({ state, signedOutDestination });
  }

  return (
    <AuthContext value={{ ...session, participantStage: getParticipantStage(), refresh }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requires AuthProvider.');
  return value;
}
