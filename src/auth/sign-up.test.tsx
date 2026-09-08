import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { AuthError } from './errors';
import { createAccount, restoreAuth } from '@/services/auth';

jest.mock('@/services/amplify', () => ({}));
jest.mock('@/components/animated-icon', () => ({ AnimatedSplashOverlay: () => null }));
jest.mock('@/services/auth', () => ({
  authAvailable: true,
  passwordRequirements: () => 'Use at least 8 characters.',
  restoreAuth: jest.fn(),
  createAccount: jest.fn(),
}));

beforeEach(() => {
  jest.mocked(restoreAuth).mockReset().mockResolvedValue({ status: 'signedOut' });
  jest.mocked(createAccount).mockReset();
});

async function fillForm() {
  await fireEvent.changeText(screen.getByLabelText('Email'), ' participant@example.test ');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'fixture-password');
}

it('validates both fields and exposes accessible errors', async () => {
  await renderRouter('./src/app', { initialUrl: '/auth/sign-up' });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Create Account' }));
  expect(screen.getByLabelText('Email')).toHaveProp(
    'accessibilityHint',
    expect.stringContaining('Enter your email'),
  );
  expect(screen.getByLabelText('Password')).toHaveProp(
    'accessibilityHint',
    expect.stringContaining('Enter a password'),
  );
  expect(createAccount).not.toHaveBeenCalled();
});

it('prevents duplicate requests and lets the guard replace Sign Up without secret route params', async () => {
  const pending = Promise.withResolvers<void>();
  jest.mocked(createAccount).mockReturnValue(pending.promise);
  const navigation = renderRouter('./src/app', { initialUrl: '/auth/sign-up' });
  await navigation;
  await fillForm();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Create Account' }));
  expect(screen.getByRole('button', { name: 'Creating account…' })).toBeDisabled();
  await fireEvent(screen.getByLabelText('Password'), 'submitEditing');
  expect(createAccount).toHaveBeenCalledTimes(1);
  jest
    .mocked(restoreAuth)
    .mockResolvedValue({ status: 'confirmationPending', email: 'participant@example.test' });
  await act(() => pending.resolve());
  expect(navigation.getPathname()).toBe('/auth/verify-email');
  expect(navigation.getSearchParams()).toEqual({});
  expect(router.canGoBack()).toBe(false);
});

it.each(['accountExists', 'passwordRejected', 'network'] as const)(
  'keeps the form usable after %s',
  async (code) => {
    jest.mocked(createAccount).mockRejectedValue(new AuthError(code));
    await renderRouter('./src/app', { initialUrl: '/auth/sign-up' });
    await fillForm();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByRole('alert')).toHaveTextContent(`Error: ${new AuthError(code).message}`);
    expect(screen.getByLabelText('Email')).toHaveProp('value', ' participant@example.test ');
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Existing account? Sign In' })).toBeOnTheScreen();
  },
);
