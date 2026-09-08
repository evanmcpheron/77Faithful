import type { ReactNode } from 'react';

import { CompletionControl, type CompletionControlProps } from './completion-control';
import { NavigationRow, type NavigationRowProps } from './navigation-row';
import { ScreenHeading } from './screen-heading';
import { Surface } from './surface';
import { ThemedText } from './themed-text';

export type PracticeCardProps = {
  // Supply the definition applicable to this day, including historical practice names.
  title: string;
  supportingText?: string;
  complete: boolean;
  navigation?: Pick<NavigationRowProps, 'href' | 'disabled' | 'accessibilityHint'> & {
    onPress: NonNullable<NavigationRowProps['onPress']>;
  };
  completion?: Pick<CompletionControlProps, 'onCheckedChange' | 'disabled' | 'pending'>;
  children?: ReactNode;
};

export function PracticeCard({
  title,
  supportingText,
  complete,
  navigation,
  completion,
  children,
}: PracticeCardProps) {
  const status = complete ? 'Complete' : 'Not complete';

  return (
    <Surface>
      {navigation ? (
        <NavigationRow
          {...navigation}
          label={title}
          supportingText={supportingText}
          accessibilityLabel={[title, supportingText, !completion && status]
            .filter(Boolean)
            .join(', ')}
        />
      ) : (
        <ScreenHeading level="section" title={title} description={supportingText} />
      )}
      {children}
      {/* Sibling targets keep completion and inline content outside navigation's press area. */}
      {completion ? (
        <CompletionControl {...completion} title={`${title} completion`} checked={complete} />
      ) : (
        <ThemedText
          type="supporting"
          themeColor={complete ? 'success' : 'textSecondary'}
          accessibilityLabel={`${title}, ${status}`}>
          {status}
        </ThemedText>
      )}
    </Surface>
  );
}
