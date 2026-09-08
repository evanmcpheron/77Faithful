import type { Ref } from 'react';
import { Platform, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ScreenScrollViewProps = Pick<
  ScrollViewProps,
  | 'children'
  | 'testID'
  | 'keyboardDismissMode'
  | 'keyboardShouldPersistTaps'
  | 'onScroll'
  | 'onContentSizeChange'
  | 'scrollEventThrottle'
> & {
  ref?: Ref<ScrollView>;
  headerless?: boolean;
  bottomInsetHandled?: boolean;
};

export function ScreenScrollView({
  children,
  ref,
  headerless = false,
  bottomInsetHandled = false,
  keyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag',
  keyboardShouldPersistTaps = 'handled',
  ...props
}: ScreenScrollViewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      {...props}
      ref={ref}
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode={keyboardDismissMode}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentContainerStyle={[
        styles.content,
        {
          paddingLeft: insets.left + Spacing.four,
          paddingRight: insets.right + Spacing.four,
          // iOS measures navigation/safe-area overlap on this root scroll view.
          paddingTop: Spacing.four + (headerless && Platform.OS !== 'ios' ? insets.top : 0),
          paddingBottom:
            Spacing.four + (Platform.OS === 'ios' || bottomInsetHandled ? 0 : insets.bottom),
        },
      ]}>
      <View style={styles.sections}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1 },
  sections: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.five,
  },
});
