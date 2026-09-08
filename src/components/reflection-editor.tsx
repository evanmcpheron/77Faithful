import { Button } from './button';
import { CompletionControl, type CompletionControlProps } from './completion-control';
import { ScreenScrollView } from './screen-scroll-view';
import { ScreenSection } from './screen-section';
import { SyncStatus, type SyncStatusProps } from './sync-status';
import { TextField } from './text-field';
import { ThemedText } from './themed-text';
import { FeedbackText } from './ui/feedback-text';

export type ReflectionDraftStatus = SyncStatusProps | { status: 'unsaved' } | { status: 'saving' };

export type ReflectionEditorProps = {
  question: string;
  privateResponse: string;
  onPrivateResponseChange: (privateResponse: string) => void;
  draftStatus: ReflectionDraftStatus;
  // Callers persist private text before recording completion; drafts alone never complete it.
  onSaveAndComplete: (privateResponse: string) => void;
  onSavePrivateResponse: (privateResponse: string) => void;
  saving?: boolean;
  completion: Pick<CompletionControlProps, 'checked' | 'onCheckedChange' | 'disabled' | 'pending'>;
  completionFailed?: boolean;
};

export function ReflectionEditor({
  question,
  privateResponse,
  onPrivateResponseChange,
  draftStatus,
  onSaveAndComplete,
  onSavePrivateResponse,
  saving = false,
  completion,
  completionFailed = false,
}: ReflectionEditorProps) {
  const blocked = saving || completion.disabled || completion.pending === 'local';
  const hasResponse = privateResponse.trim().length > 0;

  return (
    <ScreenScrollView testID="reflection-editor-scroll">
      <ScreenSection title="Reflection">
        <ThemedText selectable>{question}</ThemedText>
      </ScreenSection>
      <ScreenSection>
        <TextField
          label="Private response (optional)"
          helperText="Your response is private. Writing is optional; saving a draft does not mark reflection complete."
          value={privateResponse}
          onChangeText={onPrivateResponseChange}
          disabled={blocked}
          multiline
          autoComplete="off"
          importantForAutofill="no"
        />
        {draftStatus.status === 'unsaved' || draftStatus.status === 'saving' ? (
          <FeedbackText>
            {draftStatus.status === 'saving' ? 'Saving draft…' : 'Draft not saved'}
          </FeedbackText>
        ) : (
          <SyncStatus {...draftStatus} />
        )}
      </ScreenSection>
      <ScreenSection>
        {completion.checked ? (
          <>
            <CompletionControl
              {...completion}
              disabled={blocked}
              title="Reflection complete"
              description="Mark incomplete only if you want to change this recorded practice."
            />
            <Button
              disabled={blocked}
              loading={saving}
              loadingLabel="Saving response"
              onPress={() => onSavePrivateResponse(privateResponse)}>
              Save response
            </Button>
          </>
        ) : (
          <>
            <Button
              disabled={blocked || !hasResponse}
              loading={saving}
              loadingLabel="Saving response and recording completion"
              onPress={() => onSaveAndComplete(privateResponse)}>
              Save & mark reflection complete
            </Button>
            <Button
              variant="secondary"
              disabled={blocked}
              loading={completion.pending === 'local'}
              loadingLabel="Recording reflection completion"
              onPress={() => completion.onCheckedChange(true)}>
              I reflected without writing
            </Button>
          </>
        )}
        {completionFailed && (
          <FeedbackText error themeColor="error">
            Reflection completion could not be saved. Your response has not been cleared. Please try
            again.
          </FeedbackText>
        )}
      </ScreenSection>
    </ScreenScrollView>
  );
}
