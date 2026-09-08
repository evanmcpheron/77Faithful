import { Surface } from './surface';
import { SyncStatus, type SyncStatusProps } from './sync-status';
import { TextField, type TextFieldProps } from './text-field';
import { ThemedText } from './themed-text';

export type MorningIntentionProps = Pick<
  TextFieldProps,
  'ref' | 'disabled' | 'error' | 'onBlur' | 'onFocus' | 'onContentSizeChange'
> & {
  prompt: string;
  value: string;
  onChangeText: (value: string) => void;
  syncStatus?: SyncStatusProps;
};

export function MorningIntention({ prompt, syncStatus, ...editorProps }: MorningIntentionProps) {
  return (
    <Surface>
      <ThemedText>{prompt}</ThemedText>
      <TextField
        {...editorProps}
        multiline
        label="Morning intention (optional)"
        helperText="Your intention is private and is not one of the five required practices."
      />
      {syncStatus && <SyncStatus {...syncStatus} />}
    </Surface>
  );
}
