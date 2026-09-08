import { useEffect, useRef, useState } from 'react';

import { authError, type AuthError } from './errors';

type Action = 'submit' | 'resend' | 'exit' | 'refresh';

export function useAuthAction() {
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState<AuthError>();
  const lifecycle = useRef({ active: true, busy: false });
  useEffect(() => {
    const current = lifecycle.current;
    current.active = true;
    return () => {
      current.active = false;
    };
  }, []);

  async function run(action: Action, work: () => Promise<void>) {
    const current = lifecycle.current;
    if (current.busy) return;
    current.busy = true;
    setPending(action);
    setError(undefined);
    try {
      await work();
    } catch (error) {
      if (current.active) setError(authError(error));
    } finally {
      current.busy = false;
      if (current.active) setPending(null);
    }
  }
  return { pending, error, run };
}
