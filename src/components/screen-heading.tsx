import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';

export type ScreenHeadingProps = {
  title: string;
  description?: string;
  level?: 'screen' | 'section';
};

export function ScreenHeading({ title, description, level = 'screen' }: ScreenHeadingProps) {
  return (
    <View style={styles.heading}>
      <ThemedText type={level === 'screen' ? 'heading' : 'section'} accessibilityRole="header">
        {title}
      </ThemedText>
      {description ? (
        <ThemedText type="supporting" themeColor="textSecondary">
          {description}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { gap: Spacing.two },
});
