import type { TabTriggerSlotProps } from 'expo-router/ui';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';

import { ControlSize, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={[styles.container, { backgroundColor: colors.background }]}>
      <TabSlot style={styles.slot} />
      <TabList
        role="navigation"
        aria-label="Main navigation"
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
      role="link"
      aria-current={isFocused ? 'page' : undefined}
      style={({ pressed }) => [
        styles.tabButton,
        {
          backgroundColor: pressed
            ? colors.surface
            : isFocused
              ? colors.backgroundSelected
              : colors.backgroundElement,
        },
      ]}>
      <ThemedText
        type={isFocused ? 'label' : 'supporting'}
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
    minHeight: ControlSize.minTouchTarget,
    minWidth: ControlSize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    borderRadius: Radius.control,
  },
});
