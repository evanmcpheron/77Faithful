import { render, screen } from '@testing-library/react-native';

import { ThemedText } from './themed-text';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
});

it.each(['light', 'dark'] as const)('uses the %s palette for links', async (scheme) => {
  jest.mocked(useColorScheme).mockReturnValue(scheme);

  await render(<ThemedText type="link">Read Scripture</ThemedText>);

  expect(screen.getByText('Read Scripture')).toHaveStyle({ color: Colors[scheme].link });
});

it('honors an explicit theme color on links', async () => {
  await render(
    <ThemedText type="link" themeColor="textSecondary">
      Read Scripture
    </ThemedText>,
  );

  expect(screen.getByText('Read Scripture')).toHaveStyle({ color: Colors.light.textSecondary });
});

it('defaults to readable system body text without limiting font scaling or wrapping', async () => {
  await render(<ThemedText>Body content</ThemedText>);

  const text = screen.getByText('Body content');
  expect(text).toHaveStyle({ fontSize: 17, lineHeight: 26, fontWeight: '400' });
  expect(text.props.allowFontScaling).not.toBe(false);
  expect(text.props.maxFontSizeMultiplier).toBeUndefined();
  expect(text.props.numberOfLines).toBeUndefined();
  expect(text.props.adjustsFontSizeToFit).not.toBe(true);
});

it('uses the section role and preserves caller styling and native accessibility props', async () => {
  await render(
    <ThemedText
      type="section"
      accessibilityRole="header"
      accessibilityLabel="Section heading"
      selectable
      style={{ color: '#123456' }}>
      Section content
    </ThemedText>,
  );

  const heading = screen.getByRole('header', { name: 'Section heading' });
  expect(heading).toHaveStyle({
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: '#123456',
  });
  expect(heading.props.selectable).toBe(true);
});

it('updates semantic foregrounds with system appearance and falls back to light', async () => {
  const { rerender } = await render(<ThemedText themeColor="onPrimary">Continue</ThemedText>);
  expect(screen.getByText('Continue')).toHaveStyle({ color: Colors.light.onPrimary });

  jest.mocked(useColorScheme).mockReturnValue('dark');
  await rerender(<ThemedText themeColor="error">Try again</ThemedText>);
  expect(screen.getByText('Try again')).toHaveStyle({ color: Colors.dark.error });

  jest.mocked(useColorScheme).mockReturnValue('unspecified');
  await rerender(<ThemedText themeColor="error">Try again</ThemedText>);
  expect(screen.getByText('Try again')).toHaveStyle({ color: Colors.light.error });
});
