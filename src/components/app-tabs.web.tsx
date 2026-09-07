import type { TabTriggerSlotProps } from 'expo-router/ui';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={[styles.container, { backgroundColor: colors.background }]}>
      <TabSlot style={styles.slot} />
      <TabList
        style={[
          styles.tabList,
          {
            backgroundColor: colors.backgroundElement,
            paddingBottom: insets.bottom + Spacing.two,
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
          },
        ]}>
        <TabTrigger name="today" href="/today" asChild>
          <TabButton>Today</TabButton>
        </TabTrigger>
        <TabTrigger name="journey" href="/journey" asChild>
          <TabButton>Journey</TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const colors = useTheme();

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tabButton,
        { backgroundColor: isFocused ? colors.backgroundSelected : colors.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <ThemedText
        type={isFocused ? 'smallBold' : 'small'}
        themeColor={isFocused ? 'text' : 'textSecondary'}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slot: { flex: 1 },
  tabList: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  pressed: { opacity: 0.7 },
});
