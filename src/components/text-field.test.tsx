import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { createRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, type TextInput } from 'react-native';

import { Button } from './button';
import { PasswordField } from './password-field';
import { TextField, type TextFieldProps } from './text-field';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn() }));

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('light');
});

it('labels an input independently of its placeholder and forwards native entry and submit behavior', async () => {
  const ref = createRef<TextInput>();
  const onChangeText = jest.fn();
  const onSubmitEditing = jest.fn();
  await render(
    <TextField
      ref={ref}
      label="Email"
      placeholder="name@example.test"
      helperText="Use your account email."
      keyboardType="email-address"
      autoComplete="email"
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="next"
      submitBehavior="submit"
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
    />,
  );
  const input = screen.getByLabelText('Email');
  expect(screen.getByText('Email')).toBeOnTheScreen();
  expect(input).toHaveProp('keyboardType', 'email-address');
  expect(input).toHaveProp('autoComplete', 'email');
  expect(input).toHaveProp('autoCapitalize', 'none');
  expect(input).toHaveProp('autoCorrect', false);
  expect(input).toHaveProp('returnKeyType', 'next');
  expect(input).toHaveProp('submitBehavior', 'submit');
  expect(input).toHaveProp('accessibilityHint', 'Use your account email.');
  expect(ref.current?.focus).toEqual(expect.any(Function));
  await userEvent.type(input, 'synthetic@example.test', { submitEditing: true });
  expect(onChangeText).toHaveBeenLastCalledWith('synthetic@example.test');
  expect(onSubmitEditing).toHaveBeenCalledTimes(1);
});

it.each(['light', 'dark'] as const)(
  'shows focus and errors together in %s and forwards focus/blur',
  async (scheme) => {
    jest.mocked(useColorScheme).mockReturnValue(scheme);
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await render(
      <TextField label="Email" error="Enter an email address." onFocus={onFocus} onBlur={onBlur} />,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveStyle({
      color: Colors[scheme].text,
      backgroundColor: Colors[scheme].surface,
      borderColor: Colors[scheme].error,
    });
    await fireEvent(input, 'focus', { nativeEvent: {} });
    expect(input).toHaveStyle({ outlineColor: Colors[scheme].focus, outlineWidth: 2 });
    expect(onFocus).toHaveBeenCalledTimes(1);
    await fireEvent(input, 'blur', { nativeEvent: {} });
    expect(StyleSheet.flatten(input.props.style).outlineWidth).toBeUndefined();
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Error: Enter an email address.');
  },
);

it.each([{ disabled: true }, { editable: false }, { readOnly: true }])(
  'prevents editing and exposes disabled semantics for %j',
  async (state) => {
    const onChangeText = jest.fn();
    await render(
      <TextField
        label="Email"
        defaultValue="synthetic@example.test"
        onChangeText={onChangeText}
        {...state}
      />,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toBeDisabled();
    expect(input).toHaveProp('editable', false);
    expect(input).toHaveStyle({
      color: Colors.light.onDisabled,
      backgroundColor: Colors.light.disabled,
    });
    await userEvent.type(input, 'ignored');
    expect(onChangeText).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('synthetic@example.test')).toBeOnTheScreen();
  },
);

it('announces new iOS errors without repeating them on keystrokes or theme changes', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
  const field = (error?: string, value = '') => (
    <TextField
      label="Verification code"
      error={error}
      value={value}
      helperText="Use the emailed code."
    />
  );
  const { rerender } = await render(field());
  expect(announce).not.toHaveBeenCalled();
  await rerender(field('This code has expired. Request another code.'));
  expect(announce).toHaveBeenLastCalledWith(
    'Verification code. Error: This code has expired. Request another code.',
  );
  expect(screen.getByLabelText('Verification code')).toHaveProp(
    'accessibilityHint',
    'Error: This code has expired. Request another code. Use the emailed code.',
  );
  jest.mocked(useColorScheme).mockReturnValue('dark');
  await rerender(field('This code has expired. Request another code.', '1'));
  expect(announce).toHaveBeenCalledTimes(1);
  await rerender(field());
  expect(screen.queryByRole('alert')).toBeNull();
  await rerender(field('Enter the complete code.'));
  expect(announce).toHaveBeenCalledTimes(2);
});

it.each(['android', 'web'] as const)(
  'uses an error live region on %s without a duplicate explicit announcement',
  async (platform) => {
    jest.replaceProperty(Platform, 'OS', platform);
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await render(
      <TextField
        label="Code"
        helperText="Use the emailed code."
        error="Enter the complete code."
      />,
    );
    expect(screen.getByRole('alert')).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(announce).not.toHaveBeenCalled();
    if (platform === 'web') {
      const errorID = screen.getByRole('alert').props.nativeID;
      const helperID = screen.getByText('Use the emailed code.').props.nativeID;
      expect(screen.getByLabelText('Code')).toHaveProp(
        'aria-describedby',
        `${errorID} ${helperID}`,
      );
      expect(screen.getByLabelText('Code')).toHaveProp('aria-invalid', true);
    }
  },
);

it('retains caller-owned text through validation and clears the error only when the caller does', async () => {
  function Fixture() {
    const [value, setValue] = useState('synthetic');
    const [error, setError] = useState<string>();
    return (
      <>
        <TextField label="Email" value={value} onChangeText={setValue} error={error} />
        <Button
          onPress={() => setError(value.includes('@') ? undefined : 'Enter an email address.')}>
          Validate fixture
        </Button>
      </>
    );
  }
  await render(<Fixture />);
  await userEvent.press(screen.getByRole('button', { name: 'Validate fixture' }));
  expect(screen.getByDisplayValue('synthetic')).toBeOnTheScreen();
  await userEvent.type(screen.getByLabelText('Email'), '@example.test');
  expect(screen.getByRole('alert')).toBeOnTheScreen();
  await userEvent.press(screen.getByRole('button', { name: 'Validate fixture' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByDisplayValue('synthetic@example.test')).toBeOnTheScreen();
});

it('leaves long multiline content and large text unconstrained and forwards editing events', async () => {
  const onContentSizeChange = jest.fn();
  const onSelectionChange = jest.fn();
  const content = 'Synthetic private editor fixture.\n'.repeat(100);
  await render(
    <TextField
      label="Reflection (optional)"
      multiline
      defaultValue={content}
      onContentSizeChange={onContentSizeChange}
      onSelectionChange={onSelectionChange}
    />,
  );
  const input = screen.getByLabelText('Reflection (optional)');
  expect(input).toHaveProp('scrollEnabled', false);
  expect(input).toHaveStyle({ minHeight: 48, textAlignVertical: 'top' });
  const style = StyleSheet.flatten(input.props.style);
  expect(style.height).toBeUndefined();
  expect(style.maxHeight).toBeUndefined();
  expect(input.props.maxLength).toBeUndefined();
  expect(input.props.numberOfLines).toBeUndefined();
  expect(input.props.allowFontScaling).not.toBe(false);
  expect(input.props.maxFontSizeMultiplier).toBeUndefined();
  expect(input.props.autoFocus).not.toBe(true);
  expect(screen.getByDisplayValue(content)).toBeOnTheScreen();
  await fireEvent(input, 'contentSizeChange', {
    nativeEvent: { contentSize: { width: 300, height: 1500 } },
  });
  await fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 10, end: 10 } } });
  expect(onContentSizeChange).toHaveBeenCalledTimes(1);
  expect(onSelectionChange).toHaveBeenCalledTimes(1);
});

it('passes through code autofill, input mode, length rules, hints and caller styles', async () => {
  const props: TextFieldProps = {
    label: 'Code',
    accessibilityLabel: 'Email verification code',
    accessibilityHint: 'Then choose Verify email.',
    inputMode: 'numeric',
    textContentType: 'oneTimeCode',
    maxLength: 6,
    style: { paddingHorizontal: 24 },
  };
  await render(<TextField {...props} />);
  const input = screen.getByLabelText('Email verification code');
  expect(input).toHaveProp('inputMode', 'numeric');
  expect(input).toHaveProp('textContentType', 'oneTimeCode');
  expect(input).toHaveProp('maxLength', 6);
  expect(input).toHaveProp('accessibilityHint', 'Then choose Verify email.');
  expect(input).toHaveStyle({ paddingHorizontal: 24 });
});

it('conceals passwords initially and toggles visibility without changing the entered password', async () => {
  const onChangeText = jest.fn();
  await render(
    <PasswordField label="New password" autoComplete="new-password" onChangeText={onChangeText} />,
  );
  const input = screen.getByLabelText('New password');
  expect(input).toHaveProp('secureTextEntry', true);
  expect(input).toHaveProp('autoCorrect', false);
  expect(input).toHaveProp('autoCapitalize', 'none');
  expect(input).toHaveProp('autoComplete', 'new-password');
  await userEvent.type(input, 'Synthetic password');
  onChangeText.mockClear();
  await userEvent.press(screen.getByRole('button', { name: 'Show new password' }));
  expect(input).toHaveProp('secureTextEntry', false);
  expect(screen.getByDisplayValue('Synthetic password')).toBeOnTheScreen();
  await userEvent.press(screen.getByRole('button', { name: 'Hide new password' }));
  expect(input).toHaveProp('secureTextEntry', true);
  expect(onChangeText).not.toHaveBeenCalled();
});

it.each([{ disabled: true }, { editable: false }, { readOnly: true }])(
  'blocks password reveal when entry is disabled with %j',
  async (state) => {
    await render(<PasswordField label="Password" {...state} />);
    const toggle = screen.getByRole('button', { name: 'Show password', disabled: true });
    await userEvent.press(toggle);
    expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', true);
  },
);
