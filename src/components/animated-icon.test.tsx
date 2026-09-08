import { fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from './animated-icon';

import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn() }));
jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
  jest.mocked(SplashScreen.hideAsync).mockResolvedValue(undefined);
});

it('keeps the native splash until layout, artwork display, and Auth readiness', async () => {
  await render(<AnimatedSplashOverlay ready={false} />);
  await fireEvent(screen.getByTestId('splash-overlay'), 'layout');
  await screen.rerender(<AnimatedSplashOverlay ready />);
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  await fireEvent(screen.getByTestId('splash-artwork'), 'display');
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});

it('allows startup after an image failure while still waiting for Auth', async () => {
  await render(<AnimatedSplashOverlay ready={false} />);
  await fireEvent(screen.getByTestId('splash-overlay'), 'layout');
  await fireEvent(screen.getByTestId('splash-artwork'), 'error', {
    nativeEvent: { error: 'Image unavailable' },
  });
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  await screen.rerender(<AnimatedSplashOverlay ready />);
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
