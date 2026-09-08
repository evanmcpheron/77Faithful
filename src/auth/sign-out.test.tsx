import { act, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { AuthError } from './errors';
import { getParticipantStage } from './participant-stage';
import { restoreAuth, signOutParticipant } from '@/services/auth';

jest.mock('@/services/amplify', () => ({}));
jest.mock('@/components/animated-icon', () => ({ AnimatedSplashOverlay: () => null }));
jest.mock('@/components/app-tabs', () => jest.requireActual('@/components/app-tabs.web'));
jest.mock('@/auth/participant-stage', () => ({
  ...jest.requireActual('@/auth/participant-stage'),
  getParticipantStage: jest.fn(),
}));
jest.mock('@/services/auth', () => ({
  authAvailable: true,
  restoreAuth: jest.fn(),
  signOutParticipant: jest.fn(),
}));

beforeEach(() => {
  jest
    .mocked(restoreAuth)
    .mockReset()
    .mockResolvedValue({
      status: 'verified',
      participant: {
        userId: 'fixture-sub',
        email: 'participant@example.test',
        emailVerified: true,
      },
    });
  jest.mocked(signOutParticipant).mockReset();
  jest.mocked(getParticipantStage).mockReturnValue({ status: 'complete' });
});

it('shows Auth identity and signs out with all protected history removed', async () => {
  const result = Promise.withResolvers<void>();
  jest.mocked(signOutParticipant).mockReturnValue(result.promise);
  const navigation = renderRouter('./src/app', { initialUrl: '/today' });
  await navigation;
  await act(() => router.push('/settings/account'));
  expect(screen.getByText('participant@example.test')).toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Sign Out' }));
  expect(screen.getByRole('button', { name: 'Signing out…' })).toBeDisabled();
  jest.mocked(restoreAuth).mockResolvedValue({ status: 'signedOut' });
  await act(() => result.resolve());
  expect(navigation.getPathname()).toBe('/auth/welcome');
  expect(router.canGoBack()).toBe(false);
  await act(() => router.push('/settings/account'));
  expect(navigation.getPathname()).toBe('/auth/welcome');
  expect(screen.queryByText('participant@example.test')).toBeNull();
});

it('keeps the participant authenticated when provider sign-out fails', async () => {
  jest.mocked(signOutParticipant).mockRejectedValue(new AuthError('network'));
  const navigation = renderRouter('./src/app', { initialUrl: '/settings/account' });
  await navigation;
  await userEvent.setup().press(screen.getByRole('button', { name: 'Sign Out' }));
  expect(navigation.getPathname()).toBe('/settings/account');
  expect(screen.getByRole('alert')).toHaveTextContent(`Error: ${new AuthError('network').message}`);
  expect(screen.getByRole('button', { name: 'Sign Out' })).toBeEnabled();
  expect(restoreAuth).toHaveBeenCalledTimes(1);
});

it('allows sign-out from onboarding without fabricating a completed journey', async () => {
  jest.mocked(getParticipantStage).mockReturnValue({ status: 'incomplete' });
  jest.mocked(signOutParticipant).mockResolvedValue(undefined);
  const navigation = renderRouter('./src/app', { initialUrl: '/onboarding' });
  await navigation;
  jest.mocked(restoreAuth).mockResolvedValue({ status: 'signedOut' });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Sign Out' }));
  expect(navigation.getPathname()).toBe('/auth/welcome');
  expect(router.canGoBack()).toBe(false);
});

it('keeps Delete Account explicitly unavailable', async () => {
  await renderRouter('./src/app', { initialUrl: '/settings/account/delete' });
  expect(
    screen.getByRole('header', { name: 'Account deletion is not available yet' }),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: /Delete my account/i })).toBeNull();
});
