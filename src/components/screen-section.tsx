import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenHeading } from './screen-heading';

import { Spacing } from '@/constants/theme';

export type ScreenSectionProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function ScreenSection({ children, title, description }: ScreenSectionProps) {
  return (
    <View style={styles.section}>
      {title ? <ScreenHeading title={title} description={description} level="section" /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
});
