import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function SettingsHeaderAction() {
  const theme = useTheme();

  return (
    <Link href="/settings" push asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Settings"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <SymbolView
          name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
          size={24}
          tintColor={theme.link}
          accessible={false}
        />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
