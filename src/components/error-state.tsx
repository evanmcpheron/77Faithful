import { StyleSheet, View } from 'react-native';

import { Button, type ButtonProps } from './button';
import { InlineNotice } from './inline-notice';

import { Spacing } from '@/constants/theme';

export type ErrorStateProps = {
  message: string;
  onRetry?: ButtonProps['onPress'];
  retrying?: boolean;
};

export function ErrorState({ message, onRetry, retrying = false }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <InlineNotice tone="error" message={message} />
      {onRetry ? (
        <Button variant="secondary" onPress={onRetry} loading={retrying} loadingLabel="Retrying…">
          Retry
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two, minWidth: 0 },
});
