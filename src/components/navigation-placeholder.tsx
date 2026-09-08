import { Link, type LinkProps } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ScreenHeading } from './screen-heading';
import { ScreenScrollView } from './screen-scroll-view';
import { ScreenSection } from './screen-section';
import { ThemedText } from './themed-text';

import { ControlSize, Spacing } from '@/constants/theme';

type NavigationPlaceholderProps = {
  title: string;
  description: string;
  children?: ReactNode;
  headerless?: boolean;
  bottomInsetHandled?: boolean;
};

export function NavigationPlaceholder({
  title,
  description,
  children,
  headerless = false,
  bottomInsetHandled = false,
}: NavigationPlaceholderProps) {
  return (
    <ScreenScrollView headerless={headerless} bottomInsetHandled={bottomInsetHandled}>
      <ScreenSection>
        <ScreenHeading title={title} description="Navigation scaffold" />
        <ThemedText>{description}</ThemedText>
        {children}
      </ScreenSection>
    </ScreenScrollView>
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
          <ThemedText type="link" style={pressed && styles.pressed}>
            {children}
          </ThemedText>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: {
    minHeight: ControlSize.minTouchTarget,
    minWidth: ControlSize.minTouchTarget,
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: { opacity: 0.95 },
});
