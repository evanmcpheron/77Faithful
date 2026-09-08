import { StyleSheet, View } from 'react-native';

import { Button } from './button';
import { CompletionControl, type CompletionControlProps } from './completion-control';
import { ScreenScrollView } from './screen-scroll-view';
import { ScreenSection } from './screen-section';
import { ThemedText } from './themed-text';
import { FeedbackText } from './ui/feedback-text';

import { Spacing } from '@/constants/theme';
import type { ReaderTranslation, ScriptureResult } from '@/services/scripture';

export type ScriptureReaderProps = {
  passageReference: string;
  scripture: ScriptureResult;
  unavailableTranslation?: ReaderTranslation | null;
  completion: Pick<CompletionControlProps, 'checked' | 'onCheckedChange' | 'disabled' | 'pending'>;
  completionFailed?: boolean;
};

export function ScriptureReader({
  passageReference,
  scripture,
  unavailableTranslation,
  completion,
  completionFailed = false,
}: ScriptureReaderProps) {
  const translation = scripture.status === 'ready' ? scripture.translation : unavailableTranslation;

  return (
    <ScreenScrollView testID="scripture-reader-scroll">
      <View style={styles.reading}>
        <ScreenSection>
          <ThemedText type="heading" accessibilityRole="header">
            {passageReference}
          </ThemedText>
          <ThemedText type="supporting" themeColor="textSecondary">
            {translation?.displayName ?? 'No translation available'}
          </ThemedText>
        </ScreenSection>
        {scripture.status === 'ready' ? (
          <View style={styles.verses}>
            {scripture.verses.map(({ chapter, verse, text }) => (
              <ThemedText key={`${chapter}:${verse}`} selectable>
                <ThemedText type="label" themeColor="textSecondary">
                  {`${chapter}:${verse}  `}
                </ThemedText>
                {text}
              </ThemedText>
            ))}
          </View>
        ) : (
          <ThemedText>
            Scripture text is unavailable. You can read the assigned passage in your Bible or
            another Bible app, then mark it complete here.
          </ThemedText>
        )}
        {translation?.attribution ? (
          <ThemedText type="supporting" themeColor="textSecondary" selectable>
            {translation.attribution}
          </ThemedText>
        ) : null}
        <ScreenSection>
          {(scripture.status === 'ready' || completion.checked) && (
            <CompletionControl
              {...completion}
              disabled={completion.disabled || completion.pending === 'local'}
              title={completion.checked ? 'Scripture complete' : 'Mark Scripture complete'}
            />
          )}
          {!completion.checked && (
            <Button
              variant={scripture.status === 'ready' ? 'secondary' : 'primary'}
              disabled={completion.disabled}
              loading={completion.pending === 'local'}
              loadingLabel="Recording Scripture completion"
              onPress={() => completion.onCheckedChange(true)}>
              I read this passage elsewhere
            </Button>
          )}
          {completionFailed && (
            <FeedbackText error themeColor="error">
              Scripture completion could not be saved. Please try again.
            </FeedbackText>
          )}
        </ScreenSection>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  reading: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: Spacing.five },
  verses: { gap: Spacing.four },
});
