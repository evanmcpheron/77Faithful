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
        bg: '$color9',
        hoverStyle: { bg: '$color10' },
        pressStyle: { bg: '$color11' },
      },
      Info: {
        bg: '$blue9',
        hoverStyle: { bg: '$blue10' },
        pressStyle: { bg: '$blue11' },
      },
      Success: {
        bg: '$green9',
        hoverStyle: { bg: '$green10' },
        pressStyle: { bg: '$green11' },
      },
      Warning: {
        bg: '$yellow9',
        hoverStyle: { bg: '$yellow10' },
        pressStyle: { bg: '$yellow11' },
      },
      Error: {
        bg: '$red9',
        hoverStyle: { bg: '$red10' },
        pressStyle: { bg: '$red11' },
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
        color: '$color1',
      },
      Info: {
        color: '$blue1',
      },
      Success: {
        color: '$green1',
      },
      Warning: {
        color: '$yellow1',
      },
      Error: {
        color: '$red1',
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
