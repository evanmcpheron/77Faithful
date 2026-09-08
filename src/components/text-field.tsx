import { useEffect, useId, useState, type Ref } from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type TextInput,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from './themed-text';
import { FormTextInput } from './ui/form-text-input';

import { BorderWidth, ControlSize, Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = TextInputProps & {
  ref?: Ref<TextInput>;
  label: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
};

export function TextField({
  label,
  helperText,
  error,
  disabled = false,
  editable = true,
  readOnly = false,
  accessibilityLabel = label,
  accessibilityHint,
  accessibilityState,
  multiline = false,
  scrollEnabled = !multiline,
  onFocus,
  onBlur,
  style,
  ...props
}: TextFieldProps) {
  const theme = useTheme();
  const id = useId();
  const [focused, setFocused] = useState(false);
  const blocked = disabled || !editable || readOnly;
  const errorMessage = error ? `Error: ${error}` : undefined;
  const hint = [errorMessage, helperText, accessibilityHint].filter(Boolean).join(' ');
  const webAccessibility =
    Platform.OS === 'web'
      ? {
          'aria-invalid': Boolean(error),
          'aria-describedby':
            [error && `${id}-error`, helperText && `${id}-helper`].filter(Boolean).join(' ') ||
            undefined,
        }
      : {};

  useEffect(() => {
    // Live regions announce changes on Android/web; VoiceOver needs an explicit announcement.
    if (Platform.OS === 'ios' && error) {
      AccessibilityInfo.announceForAccessibilityWithOptions(`${label}. Error: ${error}`, {
        queue: true,
      });
    }
  }, [error, label]);

  return (
    <View style={styles.field}>
      <ThemedText type="label">{label}</ThemedText>
      <FormTextInput
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.focus}
        underlineColorAndroid="transparent"
        {...props}
        {...webAccessibility}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={hint || undefined}
        accessibilityState={{ ...accessibilityState, disabled: blocked }}
        editable={!blocked}
        readOnly={blocked}
        multiline={multiline}
        scrollEnabled={scrollEnabled}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          {
            color: blocked ? theme.onDisabled : theme.text,
            backgroundColor: blocked ? theme.disabled : theme.surface,
            borderColor: error ? theme.error : theme.borderControl,
          },
          multiline && styles.multiline,
          style,
          focused && !blocked && { ...styles.focused, outlineColor: theme.focus },
        ]}
      />
      {helperText ? (
        <ThemedText nativeID={`${id}-helper`} type="supporting" themeColor="textSecondary">
          {helperText}
        </ThemedText>
      ) : null}
      {errorMessage ? (
        <ThemedText
          nativeID={`${id}-error`}
          type="supporting"
          themeColor="error"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          {errorMessage}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two, minWidth: 0 },
  input: {
    fontFamily: Fonts.sans,
    ...Typography.body,
    minHeight: ControlSize.minTouchTarget,
    minWidth: 0,
    borderWidth: BorderWidth.default,
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  multiline: { textAlignVertical: 'top' },
  focused: {
    outlineStyle: 'solid',
    outlineWidth: BorderWidth.focus,
    outlineOffset: Spacing.half,
  },
});
