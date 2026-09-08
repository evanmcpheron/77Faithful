import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { type SelectionControlProps } from './ui/selection-control';
import { SettingSwitch } from './ui/setting-switch';

import { ControlSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SwitchRowProps = SelectionControlProps & {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function SwitchRow({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  style,
}: SwitchRowProps) {
  const theme = useTheme();
  return (
    <View style={[styles.row, style]}>
      <View style={styles.labels}>
        <ThemedText themeColor={disabled ? 'onDisabled' : 'text'}>{title}</ThemedText>
        {description ? (
          <ThemedText type="supporting" themeColor={disabled ? 'onDisabled' : 'textSecondary'}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.target}>
        <SettingSwitch
          accessibilityLabel={[title, description].filter(Boolean).join(', ')}
          // Web's Switch already puts its role/state on the underlying input.
          {...(Platform.OS !== 'web' && {
            accessibilityRole: 'switch' as const,
            accessibilityState: { checked: value, disabled },
          })}
          value={value}
          disabled={disabled}
          onValueChange={(nextValue) => {
            if (!disabled) onValueChange(nextValue);
          }}
          trackColor={{ false: theme.borderControl, true: theme.primary }}
          ios_backgroundColor={theme.borderControl}
          hitSlop={Spacing.three}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: ControlSize.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  labels: { flex: 1, gap: Spacing.one },
  target: {
    minWidth: ControlSize.minTouchTarget,
    minHeight: ControlSize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
});
