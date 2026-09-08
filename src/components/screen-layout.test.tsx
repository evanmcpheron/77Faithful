import { render, screen, userEvent } from '@testing-library/react-native';
import { createRef } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, type ScrollView } from 'react-native';
import { SafeAreaInsetsContext, type EdgeInsets } from 'react-native-safe-area-context';

import { ScreenHeading } from './screen-heading';
import { ScreenScrollView } from './screen-scroll-view';
import { ScreenSection } from './screen-section';
import { ThemedText } from './themed-text';

import { Colors, MaxContentWidth } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

const insets = { top: 47, bottom: 34, left: 12, right: 20 };

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
});

afterEach(() => {
  jest.restoreAllMocks();
});

it.each(['ios', 'android', 'web'] as const)(
  'handles headerless, stack, and tab spacing on %s without fixed tab heights',
  async (platform) => {
    jest.replaceProperty(Platform, 'OS', platform);
    const layout = (headerless: boolean, bottomInsetHandled: boolean, measuredInsets = insets) => (
      <SafeAreaInsetsContext value={measuredInsets}>
        <ScreenScrollView
          testID="screen"
          headerless={headerless}
          bottomInsetHandled={bottomInsetHandled}>
          <ThemedText>Content</ThemedText>
        </ScreenScrollView>
      </SafeAreaInsetsContext>
    );
    const padding = () =>
      StyleSheet.flatten(screen.getByTestId('screen').props.contentContainerStyle);
    const { rerender } = await render(layout(true, false));

    expect(padding()).toMatchObject({
      paddingTop: platform === 'ios' ? 24 : 71,
      paddingBottom: platform === 'ios' ? 24 : 58,
      paddingLeft: 36,
      paddingRight: 44,
    });
    expect(screen.getByTestId('screen')).toHaveProp('contentInsetAdjustmentBehavior', 'automatic');
    expect(screen.getByTestId('screen')).toHaveProp(
      'keyboardDismissMode',
      platform === 'ios' ? 'interactive' : 'on-drag',
    );

    await rerender(layout(false, false));
    expect(padding().paddingTop).toBe(24);

    await rerender(layout(false, true));
    expect(padding().paddingBottom).toBe(24);

    await rerender(layout(true, false, { top: 0, bottom: 21, left: 47, right: 0 }));
    expect(padding()).toMatchObject({
      paddingTop: 24,
      paddingBottom: platform === 'ios' ? 24 : 45,
      paddingLeft: 71,
      paddingRight: 24,
    });
  },
);

it('keeps headings, long content, an editor, and its action in one centered scroll container', async () => {
  const ref = createRef<ScrollView>();
  const onSave = jest.fn();
  const user = userEvent.setup();
  const layout = (measuredInsets: EdgeInsets) => (
    <SafeAreaInsetsContext value={measuredInsets}>
      <ScreenScrollView ref={ref} testID="screen">
        <ScreenHeading title="Layout fixture" description="Synthetic test content" />
        <ScreenSection title="Editor fixture" description="Optional supporting copy">
          <ThemedText>{'Synthetic long-form layout content. '.repeat(100)}</ThemedText>
          <TextInput accessibilityLabel="Fixture draft" multiline scrollEnabled={false} />
          <Pressable accessibilityRole="button" onPress={onSave}>
            <ThemedText>Fixture action</ThemedText>
          </Pressable>
        </ScreenSection>
      </ScreenScrollView>
    </SafeAreaInsetsContext>
  );
  const { rerender } = await render(layout(insets));

  // Inspect the container contract; Jest cannot measure native layout or keyboard occlusion.
  const scroll = screen.getByTestId('screen');
  expect(screen.container.queryAll((node) => node.type === scroll.type)).toHaveLength(1);
  expect(screen.getByRole('header', { name: 'Layout fixture' }).parent?.parent).toHaveStyle({
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: 32,
  });
  expect(StyleSheet.flatten(scroll.props.contentContainerStyle)).toMatchObject({ flexGrow: 1 });
  expect(scroll).toHaveProp('automaticallyAdjustKeyboardInsets', true);
  expect(scroll).toHaveProp('keyboardShouldPersistTaps', 'handled');
  expect(ref.current?.scrollTo).toEqual(expect.any(Function));
  expect(screen.getByRole('header', { name: 'Layout fixture' })).toHaveStyle({ fontSize: 28 });
  expect(screen.getByRole('header', { name: 'Editor fixture' })).toHaveStyle({ fontSize: 20 });
  expect(screen.getByRole('header', { name: 'Editor fixture' }).parent).toHaveStyle({ gap: 8 });
  expect(screen.getByRole('header', { name: 'Editor fixture' }).parent?.parent).toHaveStyle({
    gap: 16,
  });
  expect(screen.getByText('Optional supporting copy')).toHaveStyle({
    color: Colors.light.textSecondary,
  });

  await user.type(screen.getByLabelText('Fixture draft'), 'Synthetic draft');
  jest.mocked(useColorScheme).mockReturnValue('dark');
  await rerender(layout({ top: 0, bottom: 0, left: 0, right: 0 }));
  expect(screen.getByTestId('screen')).toHaveStyle({ backgroundColor: Colors.dark.background });
  expect(screen.getByDisplayValue('Synthetic draft')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Fixture action' }));
  expect(onSave).toHaveBeenCalledTimes(1);
});
