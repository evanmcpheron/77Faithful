import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Link } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';
import type * as ReactNative from 'react-native';
import { Pressable, Text, View } from 'react-native';

import { NavigationRow } from './navigation-row';
import { Separator } from './separator';
import { Surface } from './surface';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));
jest.mock('expo-symbols', () => ({
  SymbolView: () => {
    const { Text } = jest.requireActual<typeof ReactNative>('react-native');
    return <Text>Decorative glyph</Text>;
  },
}));

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
});

it.each(['light', 'dark'] as const)(
  'keeps a %s surface passive and its contents individually accessible',
  async (scheme) => {
    jest.mocked(useColorScheme).mockReturnValue(scheme);
    await render(
      <Surface testID="surface">
        <Text accessibilityRole="header">Section title</Text>
        <Separator />
        <Text>Section content</Text>
      </Surface>,
    );
    expect(screen.getByTestId('surface')).toHaveStyle({
      backgroundColor: Colors[scheme].surface,
      borderColor: Colors[scheme].border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
    });
    expect(screen.getByRole('header', { name: 'Section title' })).toBeOnTheScreen();
    expect(screen.getByText('Section content')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  },
);

it('names a Settings destination with its current value and hides both decorative icons', async () => {
  const onPress = jest.fn();
  await render(
    <NavigationRow
      label="Notifications"
      supportingText="Daily reminder off"
      icon="settings"
      onPress={onPress}
    />,
  );
  const row = screen.getByRole('link', { name: 'Notifications, Daily reminder off' });
  expect(row).toHaveStyle({ minHeight: 48, minWidth: 48 });
  expect(screen.queryByText('Decorative glyph')).toBeNull();
  expect(screen.getAllByText('Decorative glyph', { includeHiddenElements: true })).toHaveLength(2);
  await userEvent.press(row);
  expect(onPress).toHaveBeenCalledTimes(1);
});

it.each([
  ['row', 'light'],
  ['row', 'dark'],
  ['card', 'light'],
  ['card', 'dark'],
] as const)(
  'preserves Router navigation and press feedback for a %s in %s mode',
  async (appearance, scheme) => {
    jest.mocked(useColorScheme).mockReturnValue(scheme);
    const navigation = renderRouter({
      index: () => (
        <Link href="/settings" push asChild>
          <NavigationRow label="Settings" appearance={appearance} testOnly_pressed />
        </Link>
      ),
      settings: () => <Text>Destination</Text>,
    });
    await navigation;

    const row = screen.getByRole('link', { name: 'Settings' });
    expect(row.children[0]).toHaveStyle({ backgroundColor: Colors[scheme].backgroundSelected });
    expect(screen.getByText('Settings')).toHaveStyle({ color: Colors[scheme].text });
    await userEvent.press(screen.getByRole('link', { name: 'Settings' }));
    expect(navigation.getPathname()).toBe('/settings');
  },
);

it.each(['row', 'card'] as const)(
  'blocks unavailable %s navigation and removes the web destination',
  async (appearance) => {
    const navigation = renderRouter({
      index: () => (
        <Link href="/settings" asChild>
          <NavigationRow label="Settings" appearance={appearance} disabled testOnly_pressed />
        </Link>
      ),
      settings: () => <Text>Destination</Text>,
    });
    await navigation;
    const row = screen.getByRole('link', { name: 'Settings', disabled: true });
    expect(row.props.href).toBeUndefined();
    expect(row.children[0]).toHaveStyle({ backgroundColor: Colors.light.disabled });
    await userEvent.press(row);
    expect(navigation.getPathname()).toBe('/');
  },
);

it('allows labels and current values to wrap and scale without fixed heights', async () => {
  const label = 'Optional Practices for the next journey day';
  const supportingText = 'Personal Fasting or Discipline and Serve or Encourage';
  await render(<NavigationRow label={label} supportingText={supportingText} appearance="card" />);
  for (const content of [label, supportingText]) {
    const text = screen.getByText(content);
    expect(text.props.numberOfLines).toBeUndefined();
    expect(text.props.allowFontScaling).not.toBe(false);
    expect(text.props.maxFontSizeMultiplier).toBeUndefined();
    expect(text.props.adjustsFontSizeToFit).not.toBe(true);
    expect(text.parent).toHaveStyle({ flex: 1 });
  }
  expect(screen.getByRole('link')).not.toHaveStyle({ height: 48 });
});

it('shows keyboard focus and forwards focus and blur events', async () => {
  const onFocus = jest.fn();
  const onBlur = jest.fn();
  await render(<NavigationRow label="Account" onFocus={onFocus} onBlur={onBlur} />);
  const row = screen.getByRole('link');
  await fireEvent(row, 'focus', { nativeEvent: {} });
  expect(row).toHaveStyle({ outlineWidth: 2, outlineOffset: 2, outlineColor: Colors.light.focus });
  expect(onFocus).toHaveBeenCalledTimes(1);
  await fireEvent(row, 'blur', { nativeEvent: {} });
  expect(row).not.toHaveStyle({ outlineWidth: 2 });
  expect(onBlur).toHaveBeenCalledTimes(1);
});

it('keeps inline completion separate from navigation inside the same surface', async () => {
  const recordCompletion = jest.fn();
  function Entry() {
    const [checked, setChecked] = useState(false);
    return (
      <Surface>
        <Link href="/settings" asChild>
          <NavigationRow label="Open fixture reading" />
        </Link>
        <Separator />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="Fixture reading complete"
          accessibilityState={{ checked }}
          onPress={() => {
            setChecked(!checked);
            recordCompletion();
          }}>
          <Text>{checked ? 'Recorded' : 'Mark complete'}</Text>
        </Pressable>
      </Surface>
    );
  }
  const navigation = renderRouter({ index: Entry, settings: () => <View /> });
  await navigation;
  await userEvent.press(screen.getByRole('checkbox', { checked: false }));
  expect(screen.getByRole('checkbox', { checked: true })).toBeOnTheScreen();
  expect(recordCompletion).toHaveBeenCalledTimes(1);
  expect(navigation.getPathname()).toBe('/');
  await userEvent.press(screen.getByRole('checkbox', { checked: true }));
  expect(screen.getByRole('checkbox', { checked: false })).toBeOnTheScreen();
  expect(navigation.getPathname()).toBe('/');
  await userEvent.press(screen.getByRole('link', { name: 'Open fixture reading' }));
  expect(navigation.getPathname()).toBe('/settings');
  expect(recordCompletion).toHaveBeenCalledTimes(2);
});
