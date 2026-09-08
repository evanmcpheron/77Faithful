import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { AuthError } from './errors';
import { completePasswordReset, requestPasswordReset } from '@/services/auth';

jest.mock('@/services/amplify', () => ({}));
jest.mock('@/components/animated-icon', () => ({ AnimatedSplashOverlay: () => null }));
jest.mock('@/services/auth', () => ({
  authAvailable: true,
  passwordRequirements: () => undefined,
  restoreAuth: jest.fn(async () => ({ status: 'signedOut' })),
  completePasswordReset: jest.fn(),
  requestPasswordReset: jest.fn(),
}));

beforeEach(() => {
  jest.mocked(requestPasswordReset).mockReset().mockResolvedValue(undefined);
  jest.mocked(completePasswordReset).mockReset().mockResolvedValue(undefined);
});

async function request() {
  await fireEvent.changeText(screen.getByLabelText('Email'), 'participant@example.test');
  await userEvent.setup().press(screen.getByRole('button', { name: 'Send reset email' }));
}

async function fillConfirmation() {
  await fireEvent.changeText(screen.getByLabelText('Reset code'), '000000');
  await fireEvent.changeText(screen.getByLabelText('New password'), 'new-fixture-password');
}

it('requires valid email and does not advance before a real code-step response', async () => {
  const result = Promise.withResolvers<void>();
  jest.mocked(requestPasswordReset).mockReturnValue(result.promise);
  await renderRouter('./src/app', { initialUrl: '/auth/forgot-password' });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Send reset email' }));
  expect(requestPasswordReset).not.toHaveBeenCalled();
  await request();
  expect(screen.queryByLabelText('Reset code')).toBeNull();
  expect(screen.getByRole('button', { name: 'Requesting reset code…' })).toBeDisabled();
  await fireEvent(screen.getByLabelText('Email'), 'submitEditing');
  expect(requestPasswordReset).toHaveBeenCalledTimes(1);
  await act(() => result.resolve());
  expect(screen.getByLabelText('Reset code')).toBeOnTheScreen();
});

it('resends, completes only after provider acceptance, and returns to Sign In without route secrets', async () => {
  const result = Promise.withResolvers<void>();
  jest.mocked(completePasswordReset).mockReturnValue(result.promise);
  const navigation = renderRouter('./src/app', { initialUrl: '/auth/forgot-password' });
  await navigation;
  await request();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Resend reset code' }));
  expect(requestPasswordReset).toHaveBeenCalledTimes(2);
  await fillConfirmation();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Reset password' }));
  expect(screen.queryByText(/Your password has been reset/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Resetting password…' })).toBeDisabled();
  await fireEvent(screen.getByLabelText('New password'), 'submitEditing');
  expect(completePasswordReset).toHaveBeenCalledTimes(1);
  expect(completePasswordReset).toHaveBeenCalledWith(
    'participant@example.test',
    '000000',
    'new-fixture-password',
  );
  await act(() => result.resolve());
  expect(screen.getByText(/Your password has been reset/)).toBeOnTheScreen();
  expect(screen.queryByLabelText('New password')).toBeNull();
  expect(navigation.getSearchParams()).toEqual({});
  await userEvent.setup().press(screen.getByRole('link', { name: 'Back to Sign In' }));
  expect(navigation.getPathname()).toBe('/auth/sign-in');
  expect(navigation.getSearchParams()).toEqual({});
});

it('preserves the request form on network failure', async () => {
  jest.mocked(requestPasswordReset).mockRejectedValue(new AuthError('network'));
  await renderRouter('./src/app', { initialUrl: '/auth/forgot-password' });
  await request();
  expect(screen.getByRole('alert')).toHaveTextContent(`Error: ${new AuthError('network').message}`);
  expect(screen.getByLabelText('Email')).toHaveProp('value', 'participant@example.test');
  expect(screen.queryByLabelText('Reset code')).toBeNull();
});

it.each(['invalidCode', 'expiredCode', 'passwordRejected', 'network'] as const)(
  'preserves reset progress after %s',
  async (code) => {
    jest.mocked(completePasswordReset).mockRejectedValue(new AuthError(code));
    await renderRouter('./src/app', { initialUrl: '/auth/forgot-password' });
    await request();
    await fillConfirmation();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Reset password' }));
    expect(screen.getByRole('alert')).toHaveTextContent(`Error: ${new AuthError(code).message}`);
    expect(screen.getByLabelText('Reset code')).toHaveProp('value', '000000');
    expect(screen.getByLabelText('New password')).toHaveProp('value', 'new-fixture-password');
    expect(screen.queryByText(/Your password has been reset/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Reset password' })).toBeEnabled();
  },
);
