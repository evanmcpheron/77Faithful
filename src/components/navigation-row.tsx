import { useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppIcon, type AppIconName } from './app-icon';
import { Surface } from './surface';
import { ThemedText } from './themed-text';

import { BorderWidth, ControlSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type NavigationRowProps = Omit<
  ComponentProps<typeof Pressable>,
  'children' | 'style' | 'accessibilityRole' | 'accessibilityState' | 'aria-disabled' | 'role'
> & {
  label: string;
  icon?: AppIconName;
  appearance?: 'row' | 'card';
  style?: ViewStyle;
  // Forwarded by Link asChild; destinations and navigation history belong to the caller.
  href?: string;
} & (
    | { supportingText?: string; supportingContent?: never }
    | { supportingText?: never; supportingContent: ReactNode; accessibilityLabel: string }
  );

export function NavigationRow({
  label,
  supportingText,
  supportingContent,
  icon,
  appearance = 'row',
  disabled = false,
  accessibilityLabel,
  href,
  style,
  onFocus,
  onBlur,
  ...props
}: NavigationRowProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const Container = appearance === 'card' ? Surface : View;
  const linkProps = { href: disabled ? undefined : href };

  return (
    <Pressable
      {...props}
      {...linkProps}
      accessible
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? [label, supportingText].filter(Boolean).join(', ')}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        styles.target,
        appearance === 'card' && styles.card,
        style,
        focused && { ...styles.focused, outlineColor: theme.focus },
      ]}>
      {({ pressed }) => (
        // Router's asChild slot requires static Pressable styles; feedback lives in its child.
        <Container
          style={[
            styles.content,
            {
              backgroundColor: disabled
                ? theme.disabled
                : pressed
                  ? theme.backgroundSelected
                  : appearance === 'card'
                    ? theme.surface
                    : 'transparent',
            },
          ]}>
          {icon && <AppIcon name={icon} themeColor={disabled ? 'onDisabled' : 'textSecondary'} />}
          <View style={styles.labels}>
            <ThemedText type="body" themeColor={disabled ? 'onDisabled' : 'text'}>
              {label}
            </ThemedText>
            {supportingText ? (
              <ThemedText type="supporting" themeColor={disabled ? 'onDisabled' : 'textSecondary'}>
                {supportingText}
              </ThemedText>
            ) : null}
            {supportingContent}
          </View>
          <AppIcon name="chevronRight" themeColor={disabled ? 'onDisabled' : 'textSecondary'} />
        </Container>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {
    minHeight: ControlSize.minTouchTarget,
    minWidth: ControlSize.minTouchTarget,
    borderRadius: Radius.control,
  },
  card: { borderRadius: Radius.surface },
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
    gap: Spacing.three,
    padding: Spacing.three,
  },
  labels: { flex: 1, gap: Spacing.one },
});
