import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AuthProvider, useAuth } from './auth-provider';
import { AuthError } from './errors';
import { getParticipantStage, postAuthDestination } from './participant-stage';
import type { ResolvedAuthState } from './types';

import { restoreAuth } from '@/services/auth';

jest.mock('@/services/auth', () => ({ restoreAuth: jest.fn() }));

it('does not assume signed out while restoring', async () => {
  const pending = Promise.withResolvers<ResolvedAuthState>();
  jest.mocked(restoreAuth).mockReturnValue(pending.promise);
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  expect(result.current.state.status).toBe('restoring');
  await act(() => pending.resolve({ status: 'signedOut' }));
  expect(result.current.state.status).toBe('signedOut');
});

it('retains a safe retryable error and re-resolves authoritative state', async () => {
  jest.mocked(restoreAuth).mockRejectedValueOnce(new AuthError('network'));
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.state.status).toBe('restoreError'));
  jest.mocked(restoreAuth).mockResolvedValueOnce({ status: 'signedOut' });
  await act(() => result.current.refresh());
  expect(result.current.state).toEqual({ status: 'signedOut' });
});

it('prevents an older restoration from overwriting a later auth transition', async () => {
  const old = Promise.withResolvers<ResolvedAuthState>();
  jest
    .mocked(restoreAuth)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce({ status: 'signedOut' });
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await act(() => result.current.refresh());
  await act(() =>
    old.resolve({ status: 'verified', participant: { userId: 'old-sub', emailVerified: true } }),
  );
  expect(result.current.state.status).toBe('signedOut');
});

it('does not fabricate completed onboarding from the absence of Data', () => {
  expect(getParticipantStage()).toEqual({ status: 'incomplete' });
  expect(postAuthDestination({ status: 'incomplete' })).toBe('/onboarding');
  expect(postAuthDestination({ status: 'complete' })).toBe('/today');
  expect(postAuthDestination({ status: 'loading' })).toBeNull();
  expect(postAuthDestination({ status: 'error' })).toBeNull();
});
