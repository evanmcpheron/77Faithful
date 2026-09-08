import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { AuthError } from './errors';
import {
  cancelSignUp,
  confirmEmail,
  refreshEmailVerification,
  resendEmailCode,
  restoreAuth,
  signOutParticipant,
} from '@/services/auth';

jest.mock('@/services/amplify', () => ({}));
jest.mock('@/components/animated-icon', () => ({ AnimatedSplashOverlay: () => null }));
jest.mock('@/services/auth', () => ({
  authAvailable: true,
  passwordRequirements: () => undefined,
  restoreAuth: jest.fn(),
  confirmEmail: jest.fn(),
  resendEmailCode: jest.fn(),
  refreshEmailVerification: jest.fn(),
  cancelSignUp: jest.fn(),
  signOutParticipant: jest.fn(),
}));

beforeEach(() => {
  jest
    .mocked(restoreAuth)
    .mockReset()
    .mockResolvedValue({ status: 'confirmationPending', email: 'participant@example.test' });
  jest.mocked(confirmEmail).mockReset().mockResolvedValue(undefined);
  jest.mocked(resendEmailCode).mockReset().mockResolvedValue(undefined);
  jest.mocked(refreshEmailVerification).mockReset().mockResolvedValue(undefined);
  jest.mocked(cancelSignUp).mockReset().mockResolvedValue(undefined);
  jest.mocked(signOutParticipant).mockReset().mockResolvedValue(undefined);
});

it('requires Sign In after registration confirmation, without secret route params', async () => {
  const navigation = renderRouter('./src/app');
  await navigation;
  await fireEvent.changeText(screen.getByLabelText('Confirmation code'), '000000');
  jest.mocked(restoreAuth).mockResolvedValue({ status: 'signedOut' });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Verify email' }));
  expect(confirmEmail).toHaveBeenCalledWith('registration', '000000');
  expect(navigation.getPathname()).toBe('/auth/sign-in');
  expect(navigation.getSearchParams()).toEqual({});
});

it.each(['invalidCode', 'expiredCode', 'network'] as const)(
  'allows verification retry after %s',
  async (code) => {
    jest.mocked(confirmEmail).mockRejectedValue(new AuthError(code));
    await renderRouter('./src/app');
    await fireEvent.changeText(screen.getByLabelText('Confirmation code'), '000000');
    await userEvent.setup().press(screen.getByRole('button', { name: 'Verify email' }));
    expect(screen.getByRole('alert')).toHaveTextContent(`Error: ${new AuthError(code).message}`);
    expect(screen.getByLabelText('Confirmation code')).toHaveProp('value', '000000');
    expect(screen.getByRole('button', { name: 'Verify email' })).toBeEnabled();
  },
);

it('reports resend only after the provider resolves', async () => {
  const pending = Promise.withResolvers<void>();
  jest.mocked(resendEmailCode).mockReturnValue(pending.promise);
  await renderRouter('./src/app');
  await userEvent.setup().press(screen.getByRole('button', { name: 'Resend code' }));
  expect(screen.queryByText(/Another confirmation code/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Sending code…' })).toBeDisabled();
  await act(() => pending.resolve());
  expect(resendEmailCode).toHaveBeenCalledWith('registration');
  expect(screen.getByText(/Another confirmation code/)).toBeOnTheScreen();
});

it('explicitly clears pending confirmation on cancellation', async () => {
  const navigation = renderRouter('./src/app');
  await navigation;
  jest.mocked(restoreAuth).mockResolvedValue({ status: 'signedOut' });
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Cancel and return to Welcome' }));
  expect(cancelSignUp).toHaveBeenCalledTimes(1);
  expect(signOutParticipant).not.toHaveBeenCalled();
  expect(navigation.getPathname()).toBe('/auth/welcome');
});

it.each([false, true])(
  'rechecks authoritative attributes after signed-in verification: %s',
  async (verified) => {
    jest.mocked(restoreAuth).mockResolvedValue({
      status: 'unverified',
      participant: { userId: 'fixture-sub', emailVerified: false },
    });
    const navigation = renderRouter('./src/app');
    await navigation;
    await fireEvent.changeText(screen.getByLabelText('Confirmation code'), '000000');
    if (verified)
      jest.mocked(restoreAuth).mockResolvedValue({
        status: 'verified',
        participant: { userId: 'fixture-sub', emailVerified: true },
      });
    await userEvent.setup().press(screen.getByRole('button', { name: 'Verify email' }));
    expect(confirmEmail).toHaveBeenCalledWith('attribute', '000000');
    expect(refreshEmailVerification).toHaveBeenCalledTimes(1);
    expect(navigation.getPathname()).toBe(verified ? '/onboarding' : '/auth/verify-email');
    if (!verified) expect(screen.getByText(/still unverified/)).toBeOnTheScreen();
  },
);

it('supports authenticated resend and sign-out', async () => {
  jest.mocked(restoreAuth).mockResolvedValue({
    status: 'unverified',
    participant: { userId: 'fixture-sub', emailVerified: false },
  });
  const navigation = renderRouter('./src/app');
  await navigation;
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: 'Resend code' }));
  expect(resendEmailCode).toHaveBeenCalledWith('attribute');
  jest.mocked(restoreAuth).mockResolvedValue({ status: 'signedOut' });
  await user.press(screen.getByRole('button', { name: 'Sign Out' }));
  expect(signOutParticipant).toHaveBeenCalledTimes(1);
  expect(navigation.getPathname()).toBe('/auth/welcome');
});

it('retains the authenticated gate after refresh failure and supports checking again without reusing the code', async () => {
  jest.mocked(restoreAuth).mockResolvedValue({
    status: 'unverified',
    participant: { userId: 'fixture-sub', emailVerified: false },
  });
  jest.mocked(refreshEmailVerification).mockRejectedValueOnce(new AuthError('network'));
  const navigation = renderRouter('./src/app');
  await navigation;
  await fireEvent.changeText(screen.getByLabelText('Confirmation code'), '000000');
  await userEvent.setup().press(screen.getByRole('button', { name: 'Verify email' }));
  expect(navigation.getPathname()).toBe('/auth/verify-email');
  expect(screen.getByRole('alert')).toHaveTextContent(`Error: ${new AuthError('network').message}`);
  jest.mocked(restoreAuth).mockResolvedValue({
    status: 'verified',
    participant: { userId: 'fixture-sub', emailVerified: true },
  });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Check verification' }));
  expect(confirmEmail).toHaveBeenCalledTimes(1);
  expect(navigation.getPathname()).toBe('/onboarding');
});

it('does not show resend success after a provider failure', async () => {
  jest.mocked(resendEmailCode).mockRejectedValueOnce(new AuthError('network'));
  await renderRouter('./src/app');
  await userEvent.setup().press(screen.getByRole('button', { name: 'Resend code' }));
  expect(screen.queryByText(/Another confirmation code/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Resend code' })).toBeEnabled();
});
