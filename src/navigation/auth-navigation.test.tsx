import { act, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { AuthError } from '@/auth/errors';
import { getParticipantStage } from '@/auth/participant-stage';
import type { ResolvedAuthState } from '@/auth/types';
import { restoreAuth } from '@/services/auth';

jest.mock('@/services/amplify', () => ({}));
jest.mock('@/services/auth', () => ({
  restoreAuth: jest.fn(),
  authAvailable: true,
  passwordRequirements: () => undefined,
}));
jest.mock('@/components/animated-icon', () => ({ AnimatedSplashOverlay: () => null }));
jest.mock('@/components/app-tabs', () => jest.requireActual('@/components/app-tabs.web'));
jest.mock('@/auth/participant-stage', () => ({
  ...jest.requireActual('@/auth/participant-stage'),
  getParticipantStage: jest.fn(),
}));

beforeEach(() => {
  jest.mocked(restoreAuth).mockReset().mockResolvedValue({ status: 'signedOut' });
  jest.mocked(getParticipantStage).mockReturnValue({ status: 'incomplete' });
});

it.each(['/today', '/onboarding', '/auth/verify-email'])(
  'protects signed-out direct path %s',
  async (path) => {
    const navigation = renderRouter('./src/app', { initialUrl: path });
    await navigation;
    expect(navigation.getPathname()).toBe('/auth/welcome');
    expect(router.canGoBack()).toBe(false);
  },
);

it.each<ResolvedAuthState>([
  { status: 'confirmationPending', email: 'pending@example.test' },
  { status: 'unverified', participant: { userId: 'fixture-sub', emailVerified: false } },
])('enforces the $status gate on launch and direct navigation', async (state) => {
  jest.mocked(restoreAuth).mockResolvedValue(state);
  const navigation = renderRouter('./src/app');
  await navigation;
  expect(navigation.getPathname()).toBe('/auth/verify-email');
  for (const route of ['/onboarding', '/today', '/auth/sign-in'] as const) {
    await act(() => router.replace(route));
    expect(navigation.getPathname()).toBe('/auth/verify-email');
  }
});

it('routes a verified account into onboarding and excludes signed-out screens', async () => {
  jest.mocked(restoreAuth).mockResolvedValue({
    status: 'verified',
    participant: { userId: 'fixture-sub', emailVerified: true },
  });
  const navigation = renderRouter('./src/app', { initialUrl: '/auth/sign-in' });
  await navigation;
  expect(navigation.getPathname()).toBe('/onboarding');
  expect(router.canGoBack()).toBe(false);
});

it('does not render Welcome while startup is unresolved', async () => {
  const pending = Promise.withResolvers<ResolvedAuthState>();
  jest.mocked(restoreAuth).mockReturnValue(pending.promise);
  const navigation = renderRouter('./src/app');
  await navigation;
  expect(screen.queryByRole('header', { name: 'Welcome' })).toBeNull();
  expect(screen.getByRole('progressbar', { name: 'Restoring your account…' })).toBeOnTheScreen();
  await act(() => pending.resolve({ status: 'signedOut' }));
  expect(navigation.getPathname()).toBe('/auth/welcome');
});

it('offers retry after restoration failure without entering an auth tree', async () => {
  jest.mocked(restoreAuth).mockRejectedValueOnce(new AuthError('network'));
  const navigation = renderRouter('./src/app', { initialUrl: '/today' });
  await navigation;
  expect(navigation.getPathname()).toBe('/');
  expect(screen.queryByRole('header', { name: 'Welcome' })).toBeNull();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Retry' }));
  expect(navigation.getPathname()).toBe('/auth/welcome');
});

it('restores the future completed-onboarding route through the test seam', async () => {
  jest.mocked(getParticipantStage).mockReturnValue({ status: 'complete' });
  jest.mocked(restoreAuth).mockResolvedValue({
    status: 'verified',
    participant: { userId: 'fixture-sub', emailVerified: true },
  });
  const navigation = renderRouter('./src/app');
  await navigation;
  expect(navigation.getPathname()).toBe('/today');
  await act(() => router.push('/auth/sign-up'));
  expect(navigation.getPathname()).toBe('/today');
  expect(router.canGoBack()).toBe(false);
});
