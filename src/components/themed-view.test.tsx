import { render, screen } from '@testing-library/react-native';

import { ThemedView } from './themed-view';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
});

it.each(['light', 'dark'] as const)('uses the %s color override', async (scheme) => {
  jest.mocked(useColorScheme).mockReturnValue(scheme);

  await render(<ThemedView testID="surface" lightColor="#eeeeee" darkColor="#111111" />);

  expect(screen.getByTestId('surface')).toHaveStyle({
    backgroundColor: scheme === 'dark' ? '#111111' : '#eeeeee',
  });
});

it('falls back to the selected theme token when that scheme has no override', async () => {
  jest.mocked(useColorScheme).mockReturnValue('dark');

  await render(<ThemedView testID="surface" type="backgroundElement" lightColor="#eeeeee" />);

  expect(screen.getByTestId('surface')).toHaveStyle({
    backgroundColor: Colors.dark.backgroundElement,
  });
});

it('uses the light override when the system scheme is unspecified', async () => {
  jest.mocked(useColorScheme).mockReturnValue('unspecified');

  await render(<ThemedView testID="surface" lightColor="#eeeeee" />);

  expect(screen.getByTestId('surface')).toHaveStyle({ backgroundColor: '#eeeeee' });
});

it('preserves the caller style override', async () => {
  await render(
    <ThemedView testID="surface" lightColor="#eeeeee" style={{ backgroundColor: '#abcdef' }} />,
  );

  expect(screen.getByTestId('surface')).toHaveStyle({ backgroundColor: '#abcdef' });
});
