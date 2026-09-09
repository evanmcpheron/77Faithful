import type { ReactNode } from 'react';
import { YStack } from 'tamagui';

import { Severity } from '@77/types';
import type { TSeverity } from '@77/types';

import { SeventySevenText } from './seventy-seven-text.component';

const noticeSurfaces = {
  Default: '$surfaceElevated',
  Info: '$infoSurface',
  Success: '$successSurface',
  Warning: '$warningSurface',
  Error: '$errorSurface',
} as const;

interface ISeventySevenNoticeProps {
  children: ReactNode;
  severity?: TSeverity;
}

export const SeventySevenNotice = ({
  children,
  severity = Severity.Info,
}: ISeventySevenNoticeProps) => (
  <YStack
    bg={noticeSurfaces[severity]}
    p="$compact"
    rounded="$control"
    role={severity === Severity.Error ? 'alert' : 'status'}
  >
    <SeventySevenText size="Support" severity={severity}>
      {children}
    </SeventySevenText>
  </YStack>
);
