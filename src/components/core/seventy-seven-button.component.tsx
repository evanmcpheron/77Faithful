import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import { Button, Spinner, styled } from 'tamagui';
import type { ButtonProps } from 'tamagui';

import { Severity } from '@77/types';
import type { TSeverity } from '@77/types';

import { SeventySevenText } from './seventy-seven-text.component';

export const SeventySevenButtonAppearance = {
  Filled: 'Filled',
  Outlined: 'Outlined',
  Text: 'Text',
} as const;

export type TSeventySevenButtonAppearance =
  (typeof SeventySevenButtonAppearance)[keyof typeof SeventySevenButtonAppearance];

const buttonColors = {
  Default: {
    background: '$primary',
    pressed: '$primaryPressed',
    foreground: '$onPrimary',
    text: '$link',
  },
  Info: { background: '$info', pressed: '$infoPressed', foreground: '$onInfo', text: '$infoText' },
  Success: {
    background: '$success',
    pressed: '$successPressed',
    foreground: '$onSuccess',
    text: '$successText',
  },
  Warning: {
    background: '$warning',
    pressed: '$warningPressed',
    foreground: '$onWarning',
    text: '$warningText',
  },
  Error: {
    background: '$error',
    pressed: '$errorPressed',
    foreground: '$onError',
    text: '$errorText',
  },
} as const;

const SeventySevenButtonFrame = styled(Button, {
  name: 'SeventySevenButtonFrame',
  height: 'auto',
  minH: '$control',
  minW: '$touchTarget',
  borderWidth: 1,
  rounded: '$button',
  px: '$fieldGroup',
  py: '$compact',
  cursor: 'pointer',
  focusVisibleStyle: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: '$focus',
    outlineOffset: 3,
  },
});

interface ISeventySevenButtonProps extends Omit<ButtonProps, 'children' | 'href'> {
  appearance?: TSeventySevenButtonAppearance;
  children: ReactNode;
  href?: Href;
  isLoading?: boolean;
  severity?: TSeverity;
}

export const SeventySevenButton = ({
  accessibilityState,
  appearance = SeventySevenButtonAppearance.Filled,
  children,
  disabled = false,
  href,
  isLoading = false,
  severity = Severity.Default,
  ...buttonProps
}: ISeventySevenButtonProps) => {
  const palette = buttonColors[severity];
  const isFilled = appearance === SeventySevenButtonAppearance.Filled;
  const isText = appearance === SeventySevenButtonAppearance.Text;
  const isDisabled = disabled || isLoading;
  const foreground = isFilled ? palette.foreground : palette.text;
  const borderColor = isText ? 'transparent' : isFilled ? palette.background : palette.text;

  const button = (
    <SeventySevenButtonFrame
      bg={isFilled ? palette.background : 'transparent'}
      borderColor={borderColor}
      opacity={disabled && !isLoading ? 0.55 : 1}
      hoverStyle={{ bg: isFilled ? palette.pressed : '$surfaceElevated', borderColor }}
      pressStyle={{ bg: isFilled ? palette.pressed : '$surfaceSubtle', borderColor }}
      {...buttonProps}
      disabled={isDisabled}
      aria-busy={isLoading || buttonProps['aria-busy'] || accessibilityState?.busy}
      aria-disabled={isDisabled}
      {...(Platform.OS !== 'web'
        ? {
            accessibilityState: {
              ...accessibilityState,
              disabled: isDisabled,
              busy: isLoading || accessibilityState?.busy,
            },
          }
        : {})}
    >
      <SeventySevenText
        size="Button"
        color={foreground}
        alignment="Center"
        shrink={1}
        opacity={isLoading ? 0 : 1}
      >
        {children}
      </SeventySevenText>
      {isLoading ? <Spinner position="absolute" color={foreground} aria-hidden /> : null}
    </SeventySevenButtonFrame>
  );

  if (!href || isDisabled) return button;

  return (
    <Link href={href} asChild>
      {button}
    </Link>
  );
};
