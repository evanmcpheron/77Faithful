import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Link } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';
import type * as ReactNative from 'react-native';
import { Text, View } from 'react-native';

import { AppIcon } from './app-icon';
import { Button, type ButtonProps } from './button';
import { ExternalLink } from './external-link';
import { IconButton } from './icon-button';
import { TextLink } from './text-link';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));
// Model the Android/web glyph text that must stay out of the accessibility tree.
jest.mock('expo-symbols', () => ({
  SymbolView: () => {
    const { Text } = jest.requireActual<typeof ReactNative>('react-native');
    return <Text>Decorative symbol glyph</Text>;
  },
}));

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
});

it.each(['primary', 'secondary', 'tertiary', 'destructive'] as const)(
  '%s buttons expose a readable name and invoke the caller once',
  async (variant) => {
    const onPress = jest.fn();
    await render(
      <Button variant={variant} onPress={onPress}>
        {variant === 'destructive' ? 'Discard unsynced changes' : 'Continue'}
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ minHeight: 48, minWidth: 48 });
    await userEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  },
);

it.each(['button', 'icon', 'link'] as const)(
  'disabled %s actions expose their state and cannot activate',
  async (kind) => {
    const onPress = jest.fn();
    await render(
      kind === 'button' ? (
        <Button disabled onPress={onPress}>
          Continue
        </Button>
      ) : kind === 'icon' ? (
        <IconButton disabled onPress={onPress} icon="settings" accessibilityLabel="Settings" />
      ) : (
        <TextLink disabled onPress={onPress}>
          Review yesterday
        </TextLink>
      ),
    );
    const control = screen.getByRole(kind === 'link' ? 'link' : 'button', { disabled: true });
    await userEvent.press(control);
    expect(onPress).not.toHaveBeenCalled();
  },
);

it('blocks repeated submission while actual work is pending and recovers after failure', async () => {
  let rejectSave: (reason: Error) => void = () => {};
  const save = jest.fn(
    () =>
      new Promise<void>((_resolve, reject) => {
        rejectSave = reject;
      }),
  );

  function SaveForm() {
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    async function submit() {
      setLoading(true);
      setFailed(false);
      try {
        await save();
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    }
    return (
      <View>
        <Button loading={loading} loadingLabel="Saving changes" onPress={submit}>
          Save Changes
        </Button>
        {failed && <Text accessibilityRole="alert">Unable to save. Try again.</Text>}
      </View>
    );
  }

  await render(<SaveForm />);
  await userEvent.press(screen.getByRole('button', { name: 'Save Changes' }));
  const pending = screen.getByRole('button', {
    name: 'Saving changes',
    busy: true,
    disabled: true,
  });
  await userEvent.press(pending);
  expect(save).toHaveBeenCalledTimes(1);
  await act(() => rejectSave(new Error('Synthetic save failure')));
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to save. Try again.');
  expect(screen.getByRole('button', { name: 'Save Changes', busy: false })).toBeEnabled();
});

it('keeps pending icon actions named without exposing a second spinner control', async () => {
  const onPress = jest.fn();
  await render(
    <IconButton icon="settings" accessibilityLabel="Settings" loading onPress={onPress} />,
  );
  const control = screen.getByRole('button', { name: 'Settings', busy: true });
  expect(screen.queryByRole('progressbar')).toBeNull();
  await userEvent.press(control);
  expect(onPress).not.toHaveBeenCalled();
});

it('hides decorative symbols from native and web accessibility, including destructive cues', async () => {
  await render(
    <View>
      <AppIcon name="settings" />
      <Button variant="destructive">Delete my account</Button>
    </View>,
  );
  expect(screen.queryAllByText('Decorative symbol glyph')).toHaveLength(0);
  const glyphs = screen.getAllByText('Decorative symbol glyph', { includeHiddenElements: true });
  expect(glyphs).toHaveLength(2);
  for (const glyph of glyphs) {
    expect(glyph.parent).toHaveProp('accessibilityElementsHidden', true);
    expect(glyph.parent).toHaveProp('importantForAccessibility', 'no-hide-descendants');
    expect(glyph.parent).toHaveProp('aria-hidden', true);
  }
  expect(screen.getByRole('button', { name: 'Delete my account' })).toBeOnTheScreen();
});

it.each(['light', 'dark'] as const)(
  'uses distinct %s action surfaces with readable pressed and disabled foregrounds',
  async (scheme) => {
    jest.mocked(useColorScheme).mockReturnValue(scheme);
    const colors = Colors[scheme];
    const cases: {
      variant: ButtonProps['variant'];
      normal: string;
      pressed: string;
      text: string;
    }[] = [
      {
        variant: 'primary',
        normal: colors.primary,
        pressed: colors.primaryPressed,
        text: colors.onPrimary,
      },
      {
        variant: 'secondary',
        normal: colors.backgroundElement,
        pressed: colors.backgroundSelected,
        text: colors.link,
      },
      {
        variant: 'tertiary',
        normal: 'transparent',
        pressed: colors.backgroundSelected,
        text: colors.link,
      },
      {
        variant: 'destructive',
        normal: colors.surface,
        pressed: colors.errorSurface,
        text: colors.error,
      },
    ];
    const { rerender } = await render(<Button>Continue</Button>);
    for (const item of cases) {
      await rerender(<Button variant={item.variant}>Continue</Button>);
      expect(screen.getByText('Continue').parent).toHaveStyle({ backgroundColor: item.normal });
      await rerender(
        <Button variant={item.variant} testOnly_pressed>
          Continue
        </Button>,
      );
      expect(screen.getByText('Continue').parent).toHaveStyle({ backgroundColor: item.pressed });
      expect(screen.getByText('Continue')).toHaveStyle({ color: item.text });
      await rerender(
        <Button variant={item.variant} disabled testOnly_pressed>
          Continue
        </Button>,
      );
      expect(screen.getByText('Continue').parent).toHaveStyle({ backgroundColor: colors.disabled });
      expect(screen.getByText('Continue')).toHaveStyle({ color: colors.onDisabled });
    }
  },
);

it('allows long labels to wrap and scale without fixed control heights or truncation', async () => {
  const label = 'Discard unsynced changes and sign out of this account';
  await render(<Button variant="destructive">{label}</Button>);
  const text = screen.getByText(label);
  expect(text).toHaveStyle({ flexShrink: 1 });
  expect(text.props.numberOfLines).toBeUndefined();
  expect(text.props.allowFontScaling).not.toBe(false);
  expect(text.props.maxFontSizeMultiplier).toBeUndefined();
  expect(text.props.adjustsFontSizeToFit).not.toBe(true);
  expect(text.parent).not.toHaveStyle({ height: 48 });
});

it('shows a focus outline without changing layout and preserves caller focus handlers', async () => {
  const onFocus = jest.fn();
  const onBlur = jest.fn();
  await render(
    <Button onFocus={onFocus} onBlur={onBlur}>
      Continue
    </Button>,
  );
  const button = screen.getByRole('button');
  await fireEvent(button, 'focus', { nativeEvent: {} });
  expect(button).toHaveStyle({
    outlineWidth: 2,
    outlineOffset: 2,
    outlineColor: Colors.light.focus,
  });
  expect(onFocus).toHaveBeenCalledTimes(1);
  await fireEvent(button, 'blur', { nativeEvent: {} });
  expect(button).not.toHaveStyle({ outlineWidth: 2 });
  expect(onBlur).toHaveBeenCalledTimes(1);
});

it.each(['button', 'icon', 'link'] as const)(
  'preserves Router asChild navigation, target size, and pressed styling for %s',
  async (kind) => {
    function Entry() {
      return (
        <Link href="/settings" push asChild>
          {kind === 'button' ? (
            <Button testOnly_pressed>Continue</Button>
          ) : kind === 'icon' ? (
            <IconButton testOnly_pressed icon="settings" accessibilityLabel="Settings" />
          ) : (
            <TextLink testOnly_pressed>Continue</TextLink>
          )}
        </Link>
      );
    }
    const navigation = renderRouter({ index: Entry, settings: () => <Text>Destination</Text> });
    await navigation;
    const link = screen.getByRole('link');
    expect(link).toHaveStyle({ minHeight: 48, minWidth: 48 });
    expect(link.children[0]).toHaveStyle({
      backgroundColor:
        kind === 'button' ? Colors.light.primaryPressed : Colors.light.backgroundSelected,
    });
    await userEvent.press(link);
    expect(navigation.getPathname()).toBe('/settings');
  },
);

it.each([{ disabled: true }, { loading: true }])(
  'blocks Router navigation and removes the web href when unavailable: %o',
  async (state) => {
    const navigation = renderRouter({
      index: () => (
        <Link href="/settings" asChild>
          <Button {...state}>Continue</Button>
        </Link>
      ),
      settings: () => <Text>Destination</Text>,
    });
    await navigation;
    const link = screen.getByRole('link', { disabled: true });
    expect(link.props.href).toBeUndefined();
    await userEvent.press(link);
    expect(navigation.getPathname()).toBe('/');
  },
);

it('composes the existing external navigation adapter with a shared textual control', async () => {
  await render(
    <ExternalLink href="https://example.com" asChild>
      <TextLink>External information</TextLink>
    </ExternalLink>,
  );
  const link = screen.getByRole('link', { name: 'External information' });
  expect(link).toHaveStyle({ minHeight: 48, minWidth: 48 });
  expect(screen.getByText('External information')).toHaveStyle({ textDecorationLine: 'underline' });
});
