import { Surface } from './surface';
import { FeedbackText } from './ui/feedback-text';

import { useTheme } from '@/hooks/use-theme';

export type InlineNoticeProps = {
  message: string;
  tone?: 'info' | 'error';
};

export function InlineNotice({ message, tone = 'info' }: InlineNoticeProps) {
  const theme = useTheme();
  const error = tone === 'error';

  return (
    <Surface style={{ backgroundColor: error ? theme.errorSurface : theme.backgroundElement }}>
      <FeedbackText error={error} themeColor={error ? 'error' : 'textSecondary'}>
        {error ? `Error: ${message}` : message}
      </FeedbackText>
    </Surface>
  );
}
