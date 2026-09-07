import { Link, type LinkProps } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type NavigationPlaceholderProps = {
  title: string;
  description: string;
  children?: ReactNode;
  headerless?: boolean;
};

export function NavigationPlaceholder({
  title,
  description,
  children,
  headerless = false,
}: NavigationPlaceholderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        {
          paddingLeft: insets.left + Spacing.four,
          paddingRight: insets.right + Spacing.four,
          paddingTop: Spacing.four + (headerless && Platform.OS !== 'ios' ? insets.top : 0),
          // iOS adjusts scroll content for navigation; native Android tabs consume their bottom inset.
          paddingBottom: Spacing.four + (Platform.OS === 'ios' ? 0 : insets.bottom),
        },
      ]}>
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" accessibilityRole="header">
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Navigation scaffold
        </ThemedText>
        <ThemedText>{description}</ThemedText>
        {children}
      </ThemedView>
    </ScrollView>
  );
}

type PlaceholderLinkProps = Pick<LinkProps, 'href' | 'push' | 'replace' | 'dismissTo'> & {
  children: string;
};

export function PlaceholderLink({ children, ...props }: PlaceholderLinkProps) {
  return (
    <Link {...props} asChild>
      <Pressable accessibilityRole="link" style={styles.link}>
        {({ pressed }) => (
          <ThemedText themeColor="link" style={[styles.linkText, pressed && styles.pressed]}>
            {children}
          </ThemedText>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1 },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  link: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  linkText: { textDecorationLine: 'underline' },
  pressed: { opacity: 0.95 },
});
