import { act, screen, userEvent, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { generateStaticParams } from '@/app/(app)/day/[dayNumber]/_layout';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
}));

jest.mock('@/services/amplify', () => ({}));

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
  const getStarted = screen.getByRole('link', { name: 'Get Started' });
  expect(getStarted).toHaveStyle({ minWidth: 48, minHeight: 48 });
  await user.press(getStarted);
  expect(navigation.getPathname()).toBe('/auth/sign-up');
  expect(screen.queryByRole('button', { name: 'Create Account' })).not.toBeOnTheScreen();
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/auth/welcome');

  await user.press(screen.getByRole('link', { name: 'I already have an account' }));
  await user.press(screen.getByRole('link', { name: 'Forgot password' }));
  expect(navigation.getPathname()).toBe('/auth/forgot-password');
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/auth/sign-in');
  await user.press(screen.getByRole('link', { name: 'Forgot password' }));
  await user.press(screen.getByRole('link', { name: 'Return to Sign In' }));
  expect(navigation.getPathname()).toBe('/auth/sign-in');

  await user.press(screen.getByRole('link', { name: 'Create account' }));
  expect(navigation.getPathname()).toBe('/auth/sign-up');
  await user.press(screen.getByRole('link', { name: 'Existing account? Sign In' }));
  expect(navigation.getPathname()).toBe('/auth/sign-in');
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/auth/welcome');
});

it('exposes the Verify Email scaffold with only a deterministic cancellation path', async () => {
  const navigation = renderRouter('./src/app', { initialUrl: '/auth/verify-email' });
  await navigation;
  const user = userEvent.setup();

  expect(screen.getByRole('header', { name: 'Verify Email' })).toBeOnTheScreen();
  await user.press(screen.getByRole('link', { name: 'Cancel and return to Welcome' }));
  expect(navigation.getPathname()).toBe('/auth/welcome');
  expect(router.canGoBack()).toBe(false);
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

  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/onboarding/bible-translation');
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/onboarding/practices');
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/onboarding');
  await user.press(screen.getByRole('link', { name: 'Continue to Practices' }));
  await user.press(screen.getByRole('link', { name: 'Continue to Bible Translation' }));
  await user.press(screen.getByRole('link', { name: 'Continue to Confirmation' }));
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

    const mainNavigation = screen.getByLabelText('Main navigation');
    expect(mainNavigation).toHaveProp('role', 'navigation');
    expect(within(mainNavigation).getAllByRole('link')).toHaveLength(2);
    expect(within(mainNavigation).getByRole('link', { name: 'Today' })).toBeOnTheScreen();
    expect(within(mainNavigation).getByRole('link', { name: 'Journey' })).toBeOnTheScreen();
    const settingsAction = screen.getByRole('link', { name: 'Settings' });
    expect(settingsAction).toHaveStyle({ minWidth: 48, minHeight: 48 });
    await user.press(settingsAction);
    expect(navigation.getPathname()).toBe('/settings');
    await user.press(screen.getByRole('link', { name: 'Account' }));
    await user.press(screen.getByRole('link', { name: 'Delete Account' }));
    expect(navigation.getPathname()).toBe('/settings/account/delete');
    await act(() => router.back());
    expect(navigation.getPathname()).toBe('/settings/account');
    await user.press(screen.getByRole('link', { name: 'Delete Account' }));
    await user.press(screen.getByRole('link', { name: 'Cancel' }));
    expect(navigation.getPathname()).toBe('/settings/account');
    await act(() => router.back());
    expect(navigation.getPathname()).toBe('/settings');
    await act(() => router.back());
    expect(navigation.getPathname()).toBe(source);
  },
);

it.each([
  { name: 'Optional Practices', path: '/settings/practices' },
  { name: 'Bible Translation', path: '/settings/bible-translation' },
  { name: 'Notifications', path: '/settings/notifications' },
  { name: 'Privacy & Data', path: '/settings/privacy' },
  { name: 'About', path: '/settings/about' },
  { name: 'Help / Feedback', path: '/settings/help-feedback' },
])('opens $name and returns through Settings to the source tab', async ({ name, path }) => {
  const navigation = renderRouter('./src/app', { initialUrl: '/journey' });
  await navigation;
  const user = userEvent.setup();

  await user.press(screen.getByRole('link', { name: 'Settings' }));
  await user.press(screen.getByRole('link', { name }));
  expect(navigation.getPathname()).toBe(path);
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/settings');
  await act(() => router.back());
  expect(navigation.getPathname()).toBe('/journey');
});

it('switches the two permanent tabs and exposes the current page to web assistive technology', async () => {
  const navigation = renderRouter('./src/app', { initialUrl: '/today' });
  await navigation;
  const user = userEvent.setup();

  expect(screen.getByRole('link', { name: 'Today' })).toHaveProp('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Journey' })).not.toHaveProp('aria-current', 'page');
  await user.press(screen.getByRole('link', { name: 'Journey' }));
  expect(navigation.getPathname()).toBe('/journey');
  expect(screen.getByRole('link', { name: 'Journey' })).toHaveProp('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Today' })).not.toHaveProp('aria-current', 'page');
  await user.press(screen.getByRole('link', { name: 'Today' }));
  expect(navigation.getPathname()).toBe('/today');
  expect(screen.getByRole('link', { name: 'Today' })).toHaveProp('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Journey' })).not.toHaveProp('aria-current', 'page');
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

it.each(['scripture', 'reflection'] as const)(
  'returns directly to Today when %s was opened from that tab',
  async (target) => {
    const navigation = renderRouter('./src/app', { initialUrl: '/today' });
    await navigation;

    // A route parameter exercises navigation, without assigning a current day to the app.
    await act(() =>
      router.push({ pathname: `/day/[dayNumber]/${target}`, params: { dayNumber: 1 } }),
    );
    expect(navigation.getPathname()).toBe(`/day/1/${target}`);
    await act(() => router.back());
    expect(navigation.getPathname()).toBe('/today');
  },
);

it.each(
  ['1', '77'].flatMap((dayNumber) => [
    { path: `/day/${dayNumber}`, title: `Day ${dayNumber}` },
    { path: `/day/${dayNumber}/scripture`, title: `Day ${dayNumber} · Scripture` },
    { path: `/day/${dayNumber}/reflection`, title: `Day ${dayNumber} · Reflection` },
  ]),
)('renders the validated boundary day at $path', async ({ path, title }) => {
  const navigation = renderRouter('./src/app', { initialUrl: path });
  await navigation;

  expect(navigation.getPathname()).toBe(path);
  expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
});

it.each([
  { path: '/day/77', title: 'Day 77' },
  { path: '/day/77/scripture', title: 'Day 77 · Scripture' },
  { path: '/day/77/reflection', title: 'Day 77 · Reflection' },
])(
  'keeps the path day at $path when same-name query parameters repeat',
  async ({ path, title }) => {
    const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const navigation = renderRouter('./src/app', {
      initialUrl: `${path}?dayNumber=1&dayNumber=2`,
    });
    await navigation;

    expect(navigation.getPathname()).toBe(path);
    expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
    for (const [message] of warnings.mock.calls) {
      expect(message).toMatch(
        /^Route '.*' with param 'dayNumber' was specified both in the path and as a param, removing from path$/,
      );
    }
  },
);

it.each(
  ['0', '78', '-1', '1.5', 'abc', '01', '1e1'].flatMap((dayNumber) => [
    `/day/${dayNumber}`,
    `/day/${dayNumber}/scripture`,
    `/day/${dayNumber}/reflection`,
  ]),
)('replaces invalid day route %s with Journey', async (initialUrl) => {
  const navigation = renderRouter('./src/app', { initialUrl });
  await navigation;

  expect(navigation.getPathname()).toBe('/journey');
  expect(screen.queryByRole('link', { name: 'Open Scripture' })).not.toBeOnTheScreen();
});

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
  for (let dayNumber = 1; dayNumber <= 77; dayNumber += 1) {
    expect(params).toContainEqual({ dayNumber: String(dayNumber) });
  }
});
