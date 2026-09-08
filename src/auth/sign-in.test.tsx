import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { AuthError } from './errors';
import type { ResolvedAuthState } from './types';
import { signInParticipant, restoreAuth } from '@/services/auth';

jest.mock('@/services/amplify', () => ({}));
jest.mock('@/components/animated-icon', () => ({ AnimatedSplashOverlay: () => null }));
jest.mock('@/services/auth', () => ({
  authAvailable: true,
  passwordRequirements: () => undefined,
  restoreAuth: jest.fn(),
  signInParticipant: jest.fn(),
}));

beforeEach(() => {
  jest.mocked(restoreAuth).mockReset().mockResolvedValue({ status: 'signedOut' });
  jest.mocked(signInParticipant).mockReset().mockResolvedValue('signedIn');
});

async function fillForm() {
  await fireEvent.changeText(screen.getByLabelText('Email'), 'participant@example.test');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'fixture-password');
}

it('validates required input before calling the provider', async () => {
  await renderRouter('./src/app', { initialUrl: '/auth/sign-in' });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Sign In' }));
  expect(signInParticipant).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Email')).toHaveProp(
    'accessibilityHint',
    expect.stringContaining('Enter your email'),
  );
});

it.each<{ state: ResolvedAuthState; destination: string }>([
  {
    state: { status: 'verified', participant: { userId: 'fixture-sub', emailVerified: true } },
    destination: '/onboarding',
  },
  {
    state: { status: 'unverified', participant: { userId: 'fixture-sub', emailVerified: false } },
    destination: '/auth/verify-email',
  },
  {
    state: { status: 'confirmationPending', email: 'participant@example.test' },
    destination: '/auth/verify-email',
  },
])(
  'resolves authoritative $state.status and removes Auth history',
  async ({ state, destination }) => {
    const navigation = renderRouter('./src/app', { initialUrl: '/auth/sign-in' });
    await navigation;
    await fillForm();
    jest.mocked(restoreAuth).mockResolvedValue(state);
    if (state.status === 'confirmationPending')
      jest.mocked(signInParticipant).mockResolvedValue('confirmationPending');
    await userEvent.setup().press(screen.getByRole('button', { name: 'Sign In' }));
    expect(navigation.getPathname()).toBe(destination);
    expect(navigation.getSearchParams()).toEqual({});
    expect(router.canGoBack()).toBe(false);
  },
);

it('opens password recovery without secret route parameters', async () => {
  jest.mocked(signInParticipant).mockResolvedValue('resetPassword');
  const navigation = renderRouter('./src/app', { initialUrl: '/auth/sign-in' });
  await navigation;
  await fillForm();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Sign In' }));
  expect(navigation.getPathname()).toBe('/auth/forgot-password');
  expect(navigation.getSearchParams()).toEqual({});
});

it('prevents duplicate submission until the request completes', async () => {
  const result = Promise.withResolvers<'signedIn'>();
  jest.mocked(signInParticipant).mockReturnValue(result.promise);
  await renderRouter('./src/app', { initialUrl: '/auth/sign-in' });
  await fillForm();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Sign In' }));
  await fireEvent(screen.getByLabelText('Password'), 'submitEditing');
  expect(signInParticipant).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
  await act(() => result.resolve('signedIn'));
});

it.each(['invalidCredentials', 'network', 'configuration'] as const)(
  'keeps input usable after %s',
  async (code) => {
    jest.mocked(signInParticipant).mockRejectedValue(new AuthError(code));
    await renderRouter('./src/app', { initialUrl: '/auth/sign-in' });
    await fillForm();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Sign In' }));
    expect(screen.getByRole('alert')).toHaveTextContent(`Error: ${new AuthError(code).message}`);
    expect(screen.getByLabelText('Email')).toHaveProp('value', 'participant@example.test');
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled();
  },
);
