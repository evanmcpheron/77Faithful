import { render, screen } from '@testing-library/react-native';

import { ThemedText } from './themed-text';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
});

it.each(['light', 'dark'] as const)('uses the %s palette for primary links', async (scheme) => {
  jest.mocked(useColorScheme).mockReturnValue(scheme);

  await render(<ThemedText type="linkPrimary">Read Scripture</ThemedText>);

  expect(screen.getByText('Read Scripture')).toHaveStyle({ color: Colors[scheme].link });
});

it('honors an explicit theme color on primary links', async () => {
  await render(
    <ThemedText type="linkPrimary" themeColor="textSecondary">
      Read Scripture
    </ThemedText>,
  );

  expect(screen.getByText('Read Scripture')).toHaveStyle({ color: Colors.light.textSecondary });
});
