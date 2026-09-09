import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Button, styled } from 'tamagui';
import type { ButtonProps } from 'tamagui';

import { Severity } from '@77/types';
import type { TSeverity } from '@77/types';

import { SeventySevenText } from './seventy-seven-text.component';

const SeventySevenButtonFrame = styled(Button, {
  name: 'SeventySevenButtonFrame',
  minH: '$5',
  borderWidth: 0,
  rounded: '$4',
  px: '$4',
  cursor: 'pointer',
  variants: {
    severity: {
      Default: {
        bg: '$primary',
        hoverStyle: { bg: '$primaryPressed' },
        pressStyle: { bg: '$primaryPressed' },
      },
      Info: {
        bg: '$info',
        hoverStyle: { bg: '$infoPressed' },
        pressStyle: { bg: '$infoPressed' },
      },
      Success: {
        bg: '$successStrong',
        hoverStyle: { bg: '$successPressed' },
        pressStyle: { bg: '$successPressed' },
      },
      Warning: {
        bg: '$warning',
        hoverStyle: { bg: '$warningPressed' },
        pressStyle: { bg: '$warningPressed' },
      },
      Error: {
        bg: '$error',
        hoverStyle: { bg: '$errorPressed' },
        pressStyle: { bg: '$errorPressed' },
      },
    },
    disabled: {
      true: {
        cursor: 'not-allowed',
        opacity: 0.5,
      },
    },
  } as const,
  defaultVariants: {
    severity: Severity.Default,
  },
});

const SeventySevenButtonText = styled(SeventySevenText, {
  name: 'SeventySevenButtonText',
  bold: true,
  variants: {
    severity: {
      Default: {
        color: '$onPrimary',
      },
      Info: {
        color: '$onInfo',
      },
      Success: {
        color: '$onSuccess',
      },
      Warning: {
        color: '$onWarning',
      },
      Error: {
        color: '$onError',
      },
    },
  } as const,
  defaultVariants: {
    severity: Severity.Default,
  },
});

interface ISeventySevenButtonProps extends Omit<ButtonProps, 'children' | 'href'> {
  children: ReactNode;
  href?: Href;
  severity?: TSeverity;
}

export const SeventySevenButton = ({
  children,
  disabled = false,
  href,
  severity = Severity.Default,
  ...buttonProps
}: ISeventySevenButtonProps) => {
  const button = (
    <SeventySevenButtonFrame {...buttonProps} disabled={disabled} severity={severity}>
      <SeventySevenButtonText severity={severity}>{children}</SeventySevenButtonText>
    </SeventySevenButtonFrame>
  );

  if (!href || disabled) {
    return button;
  }

  return (
    <Link href={href} asChild>
      {button}
    </Link>
  );
};
