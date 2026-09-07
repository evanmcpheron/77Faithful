import { act, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { generateStaticParams } from '@/app/(app)/day/[dayNumber]/_layout';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
}));

// Exercise the actual web tab implementation; native tab gestures need simulator/device checks.
jest.mock('@/components/app-tabs', () => jest.requireActual('@/components/app-tabs.web'));

afterEach(() => {
  jest.useRealTimers();
});

it('launches at Welcome and keeps auth navigation in the auth stack', async () => {
  const navigation = renderRouter('./src/app');
  await navigation;
  const user = userEvent.setup();

  expect(navigation.getPathname()).toBe('/auth/welcome');
  expect(router.canGoBack()).toBe(false);
  await user.press(screen.getByRole('link', { name: 'Get Started' }));
  expect(navigation.getPathname()).toBe('/auth/sign-up');
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/auth/welcome');

  await user.press(screen.getByRole('link', { name: 'I already have an account' }));
  await user.press(screen.getByRole('link', { name: 'Forgot password' }));
  expect(navigation.getPathname()).toBe('/auth/forgot-password');
  await user.press(screen.getByRole('link', { name: 'Return to Sign In' }));
  expect(navigation.getPathname()).toBe('/auth/sign-in');

  await user.press(screen.getByRole('link', { name: 'Create account' }));
  expect(navigation.getPathname()).toBe('/auth/sign-up');
  await user.press(screen.getByRole('link', { name: 'Existing account? Sign In' }));
  expect(navigation.getPathname()).toBe('/auth/sign-in');
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/auth/welcome');
});

it('previews onboarding in order and returns to earlier steps without duplicate history', async () => {
  const navigation = renderRouter('./src/app', { initialUrl: '/onboarding' });
  await navigation;
  const user = userEvent.setup();

  await user.press(screen.getByRole('link', { name: 'Continue to Practices' }));
  expect(navigation.getPathname()).toBe('/onboarding/practices');
  await user.press(screen.getByRole('link', { name: 'Continue to Bible Translation' }));
  expect(navigation.getPathname()).toBe('/onboarding/bible-translation');
  await user.press(screen.getByRole('link', { name: 'Continue to Confirmation' }));
  expect(navigation.getPathname()).toBe('/onboarding/confirm');
  expect(screen.queryByRole('button', { name: 'Start Day 1' })).not.toBeOnTheScreen();
  expect(screen.queryByRole('link', { name: 'Start Day 1' })).not.toBeOnTheScreen();

  await user.press(screen.getByRole('link', { name: 'Review Bible Translation' }));
  expect(navigation.getPathname()).toBe('/onboarding/bible-translation');
  await user.press(screen.getByRole('link', { name: 'Continue to Confirmation' }));
  await user.press(screen.getByRole('link', { name: 'Review Practices' }));
  expect(navigation.getPathname()).toBe('/onboarding/practices');
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/onboarding');
});

it.each(['/today', '/journey'])(
  'returns from Settings through Account to its originating tab %s',
  async (source) => {
    const navigation = renderRouter('./src/app', { initialUrl: source });
    await navigation;
    const user = userEvent.setup();

    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('tab', { name: 'Today' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Journey' })).toBeOnTheScreen();
    await user.press(screen.getByRole('link', { name: 'Settings' }));
    expect(navigation.getPathname()).toBe('/settings');
    expect(screen.queryByRole('link', { name: 'Notifications' })).not.toBeOnTheScreen();
    await user.press(screen.getByRole('link', { name: 'Account' }));
    await user.press(screen.getByRole('link', { name: 'Delete Account' }));
    expect(navigation.getPathname()).toBe('/settings/account/delete');
    await user.press(screen.getByRole('link', { name: 'Cancel' }));
    expect(navigation.getPathname()).toBe('/settings/account');
    await act(() => router.back());
    expect(navigation.getPathname()).toBe('/settings');
    await act(() => router.back());
    expect(navigation.getPathname()).toBe(source);
  },
);

it('switches the two permanent tabs', async () => {
  const navigation = renderRouter('./src/app', { initialUrl: '/today' });
  await navigation;
  const user = userEvent.setup();

  await user.press(screen.getByRole('tab', { name: 'Journey' }));
  expect(navigation.getPathname()).toBe('/journey');
  expect(screen.getByRole('tab', { name: 'Journey', selected: true })).toBeOnTheScreen();
  await user.press(screen.getByRole('tab', { name: 'Today' }));
  expect(navigation.getPathname()).toBe('/today');
  expect(screen.getByRole('tab', { name: 'Today', selected: true })).toBeOnTheScreen();
});

it('keeps a validated day in focused links and pops back to the source', async () => {
  const navigation = renderRouter('./src/app', { initialUrl: '/journey' });
  await navigation;
  const user = userEvent.setup();

  await act(() => router.push({ pathname: '/day/[dayNumber]', params: { dayNumber: 24 } }));
  expect(navigation.getPathname()).toBe('/day/24');
  await user.press(screen.getByRole('link', { name: 'Open Scripture' }));
  expect(navigation.getPathname()).toBe('/day/24/scripture');
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/day/24');
  await user.press(screen.getByRole('link', { name: 'Open Reflection' }));
  expect(navigation.getPathname()).toBe('/day/24/reflection');
  await act(() => router.back());
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/journey');
});

it('returns directly to Today when a focused reader was opened from that tab', async () => {
  const navigation = renderRouter('./src/app', { initialUrl: '/today' });
  await navigation;

  // A route parameter exercises navigation, without assigning a current day to the app.
  await act(() =>
    router.push({ pathname: '/day/[dayNumber]/scripture', params: { dayNumber: 1 } }),
  );
  expect(navigation.getPathname()).toBe('/day/1/scripture');
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/today');
});

it.each(['/day/78', '/day/nope/scripture', '/day/1.5/reflection'])(
  'replaces invalid day route %s with Journey',
  async (initialUrl) => {
    const navigation = renderRouter('./src/app', { initialUrl });
    await navigation;

    expect(navigation.getPathname()).toBe('/journey');
    expect(screen.queryByRole('link', { name: 'Open Scripture' })).not.toBeOnTheScreen();
  },
);

it('returns from completion to Journey review without leaving completion in app history', async () => {
  const navigation = renderRouter('./src/app', { initialUrl: '/today' });
  await navigation;
  const user = userEvent.setup();

  await act(() => router.push('/journey-complete'));
  await user.press(screen.getByRole('link', { name: 'Review your journey' }));
  expect(navigation.getPathname()).toBe('/journey');
  expect(router.canDismiss()).toBe(false);
});

it('exports exactly the bounded public Day 1–77 parameter set', () => {
  const params = generateStaticParams();
  expect(params).toHaveLength(77);
  expect(new Set(params.map(({ dayNumber }) => dayNumber)).size).toBe(77);
  expect(params[0]).toEqual({ dayNumber: '1' });
  expect(params[76]).toEqual({ dayNumber: '77' });
});
