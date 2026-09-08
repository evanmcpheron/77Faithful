import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { ControlSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SettingsHeaderAction() {
  const theme = useTheme();

  return (
    <Link href="/settings" push asChild>
      <Pressable accessibilityRole="link" accessibilityLabel="Settings" style={styles.button}>
        {({ pressed }) => (
          <SymbolView
            name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
            size={24}
            tintColor={theme.link}
            accessible={false}
            style={pressed && styles.pressed}
          />
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: ControlSize.minTouchTarget,
    minHeight: ControlSize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
