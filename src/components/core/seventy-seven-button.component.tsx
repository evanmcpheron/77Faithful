import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Button, styled } from 'tamagui';
import type { ButtonProps } from 'tamagui';

import { Severity } from '@77/types';
import type { TSeverity } from '@77/types';

import { SeventySevenText } from './seventy-seven-text.component';

export const SeventySevenButtonAppearance = {
  Filled: 'Filled',
  Outlined: 'Outlined',
} as const;

export type TSeventySevenButtonAppearance =
  (typeof SeventySevenButtonAppearance)[keyof typeof SeventySevenButtonAppearance];

const SeventySevenButtonFrame = styled(Button, {
  name: 'SeventySevenButtonFrame',
  minH: 56,
  borderWidth: 1,
  rounded: 999,
  px: '$5',
  cursor: 'pointer',
  variants: {
    severity: {
      Default: {
        bg: '$accent',
        borderColor: '$accentSoft',
        hoverStyle: { bg: '$primaryPressed' },
        pressStyle: { bg: '$primaryPressed' },
      },
      Info: {
        bg: '$info',
        borderColor: '$info',
        hoverStyle: { bg: '$infoPressed' },
        pressStyle: { bg: '$infoPressed' },
      },
      Success: {
        bg: '$successStrong',
        borderColor: '$success',
        hoverStyle: { bg: '$successPressed' },
        pressStyle: { bg: '$successPressed' },
      },
      Warning: {
        bg: '$warning',
        borderColor: '$warningStrong',
        hoverStyle: { bg: '$warningPressed' },
        pressStyle: { bg: '$warningPressed' },
      },
      Error: {
        bg: '$error',
        borderColor: '$error',
        hoverStyle: { bg: '$errorPressed' },
        pressStyle: { bg: '$errorPressed' },
      },
    },
    appearance: {
      Filled: {
        shadowColor: '$accent',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.34,
        shadowRadius: 14,
        elevation: 6,
        hoverStyle: { scale: 1.01 },
        pressStyle: { scale: 0.985 },
      },
      Outlined: {
        bg: 'transparent',
        borderColor: '$accentSoft',
        shadowOpacity: 0,
        elevation: 0,
        hoverStyle: {
          bg: '$surface',
          borderColor: '$accent',
        },
        pressStyle: {
          bg: '$surfaceElevated',
          borderColor: '$accent',
          scale: 0.985,
        },
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
    appearance: SeventySevenButtonAppearance.Filled,
  },
});

const SeventySevenButtonText = styled(SeventySevenText, {
  name: 'SeventySevenButtonText',
  bold: true,
  fontSize: '$5',
  lineHeight: '$5',
  letterSpacing: 0.2,
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
    appearance: {
      Filled: {},
      Outlined: {
        color: '$color',
      },
    },
  } as const,
  defaultVariants: {
    severity: Severity.Default,
    appearance: SeventySevenButtonAppearance.Filled,
  },
});

interface ISeventySevenButtonProps extends Omit<ButtonProps, 'children' | 'href'> {
  appearance?: TSeventySevenButtonAppearance;
  children: ReactNode;
  href?: Href;
  severity?: TSeverity;
}

export const SeventySevenButton = ({
  appearance = SeventySevenButtonAppearance.Filled,
  children,
  disabled = false,
  href,
  severity = Severity.Default,
  ...buttonProps
}: ISeventySevenButtonProps) => {
  const button = (
    <SeventySevenButtonFrame
      {...buttonProps}
      appearance={appearance}
      disabled={disabled}
      severity={severity}
    >
      <SeventySevenButtonText appearance={appearance} severity={severity}>
        {children}
      </SeventySevenButtonText>
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
