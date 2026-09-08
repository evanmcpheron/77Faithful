import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { BorderWidth, ControlSize, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ActionControlProps = Omit<
  ComponentProps<typeof Pressable>,
  'children' | 'style' | 'accessibilityState' | 'aria-busy' | 'aria-disabled'
> & {
  style?: ViewStyle;
  loading?: boolean;
  loadingLabel?: string;
  // Forwarded by Link asChild; this component never resolves or chooses a destination.
  href?: string;
};

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

type Props = ActionControlProps & {
  appearance: ButtonVariant | 'icon' | 'link';
  label?: string;
  icon?: AppIconName;
};

export function ActionControl({
  appearance,
  label,
  icon,
  disabled = false,
  loading = false,
  loadingLabel,
  accessibilityLabel,
  accessibilityRole = 'button',
  style,
  href,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const blocked = disabled || loading;
  const foreground: ThemeColor = disabled
    ? 'onDisabled'
    : appearance === 'primary'
      ? 'onPrimary'
      : appearance === 'destructive'
        ? 'error'
        : 'link';
  const visibleLabel =
    label === undefined ? undefined : loading && loadingLabel ? loadingLabel : label;
  const actionIcon = appearance === 'destructive' ? 'warning' : icon;
  const linkProps = { href: blocked ? undefined : href };
  let normalBackground = 'transparent';
  let pressedBackground: string = theme.backgroundSelected;
  if (appearance === 'primary') {
    normalBackground = theme.primary;
    pressedBackground = theme.primaryPressed;
  } else if (appearance === 'secondary') {
    normalBackground = theme.backgroundElement;
  } else if (appearance === 'destructive') {
    normalBackground = theme.surface;
    pressedBackground = theme.errorSurface;
  }

  return (
    <Pressable
      {...props}
      {...linkProps}
      accessible
      accessibilityRole={accessibilityRole}
      accessibilityLabel={loading && loadingLabel ? loadingLabel : (accessibilityLabel ?? label)}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[styles.target, style, focused && { outlineColor: theme.focus, ...styles.focused }]}>
      {({ pressed }) => {
        const backgroundColor = disabled
          ? theme.disabled
          : pressed && !blocked
            ? pressedBackground
            : normalBackground;

        // Keep the Pressable style static: Router's asChild slot flattens style callbacks away.
        return (
          <View
            style={[
              styles.content,
              appearance === 'icon' && styles.icon,
              appearance === 'link' && styles.link,
              { backgroundColor },
              (appearance === 'secondary' || appearance === 'destructive') && {
                borderWidth: BorderWidth.default,
                borderColor: disabled
                  ? theme.onDisabled
                  : appearance === 'destructive'
                    ? theme.error
                    : theme.borderControl,
              },
            ]}>
            {actionIcon && !(appearance === 'icon' && loading) && (
              <AppIcon name={actionIcon} themeColor={foreground} size={24} />
            )}
            {loading && (
              <View
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                aria-hidden>
                <ActivityIndicator color={theme[foreground]} size="small" />
              </View>
            )}
            {visibleLabel !== undefined && (
              <ThemedText
                type={appearance === 'link' ? 'link' : 'action'}
                themeColor={foreground}
                style={[styles.label, appearance === 'link' && styles.linkLabel]}>
                {visibleLabel}
              </ThemedText>
            )}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {
    minHeight: ControlSize.minTouchTarget,
    minWidth: ControlSize.minTouchTarget,
    borderRadius: Radius.control,
  },
  focused: {
    outlineStyle: 'solid',
    outlineWidth: BorderWidth.focus,
    outlineOffset: Spacing.half,
  },
  content: {
    flexGrow: 1,
    minHeight: ControlSize.minTouchTarget,
    minWidth: ControlSize.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.control,
  },
  label: { flexShrink: 1, textAlign: 'center' },
  icon: { paddingHorizontal: Spacing.two },
  link: { justifyContent: 'flex-start', paddingHorizontal: Spacing.two },
  linkLabel: { textAlign: 'left' },
});
