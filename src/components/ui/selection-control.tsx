import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { SelectionTarget } from './selection-target';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { BorderWidth, ControlSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SelectionControlProps = {
  title: string;
  description?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

type Props = SelectionControlProps & {
  kind: 'completion' | 'selection' | 'radio';
  checked: boolean;
  onActivate: () => void;
  groupName?: string;
  pending?: 'local' | 'sync';
};

export function SelectionControl({
  title,
  description,
  disabled = false,
  style,
  kind,
  checked,
  onActivate,
  groupName,
  pending,
}: Props) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const completion = kind === 'completion';
  const status = completion ? (checked ? 'Complete' : 'Not complete') : undefined;
  const pendingText =
    pending === 'local'
      ? 'Saving on this device…'
      : pending === 'sync'
        ? 'Pending sync'
        : undefined;
  const foreground = disabled ? 'onDisabled' : completion && checked ? 'success' : 'text';

  return (
    <SelectionTarget
      role={kind === 'radio' ? 'radio' : 'checkbox'}
      label={[title, description].filter(Boolean).join(', ')}
      stateDescription={[status, pendingText].filter(Boolean).join('. ') || undefined}
      checked={checked}
      disabled={disabled}
      busy={pending === 'local'}
      groupName={groupName}
      onActivate={() => {
        if (!disabled) onActivate();
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      pressedStyle={{
        backgroundColor: completion && checked ? theme.successSurface : theme.backgroundElement,
      }}
      style={[
        styles.control,
        kind === 'selection' && styles.card,
        {
          backgroundColor: disabled
            ? theme.disabled
            : checked
              ? completion
                ? theme.successSurface
                : theme.backgroundSelected
              : theme.surface,
          borderColor: theme.borderControl,
        },
        style,
        focused && !disabled && { ...styles.focused, outlineColor: theme.focus },
      ]}>
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
        pointerEvents="none"
        style={[
          styles.indicator,
          kind === 'radio' && styles.radio,
          { borderColor: disabled ? theme.onDisabled : theme.borderControl },
        ]}>
        {checked &&
          (kind === 'radio' ? (
            <View
              style={[styles.dot, { backgroundColor: disabled ? theme.onDisabled : theme.link }]}
            />
          ) : (
            <AppIcon name="check" size={20} themeColor={foreground} />
          ))}
      </View>
      <View style={styles.labels}>
        <ThemedText type="body" themeColor={foreground}>
          {title}
        </ThemedText>
        {description ? (
          <ThemedText type="supporting" themeColor={disabled ? 'onDisabled' : 'textSecondary'}>
            {description}
          </ThemedText>
        ) : null}
        {status ? (
          <ThemedText type="supporting" themeColor={foreground}>
            {status}
          </ThemedText>
        ) : null}
        {pendingText ? (
          <ThemedText
            type="supporting"
            themeColor={disabled ? 'onDisabled' : 'warning'}
            style={!disabled && { backgroundColor: theme.warningSurface }}>
            {pendingText}
          </ThemedText>
        ) : null}
      </View>
    </SelectionTarget>
  );
}

const styles = StyleSheet.create({
  control: {
    minHeight: ControlSize.minTouchTarget,
    minWidth: ControlSize.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: BorderWidth.default,
    borderRadius: Radius.control,
  },
  card: { borderRadius: Radius.surface },
  labels: { flex: 1, gap: Spacing.one },
  indicator: {
    width: 24,
    height: 24,
    borderWidth: BorderWidth.focus,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: { borderRadius: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  focused: { outlineStyle: 'solid', outlineWidth: BorderWidth.focus, outlineOffset: Spacing.half },
});
