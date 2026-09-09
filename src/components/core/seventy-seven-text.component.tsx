import { styled, Text } from 'tamagui';

import { Severity } from '@77/types';

export const SeventySevenTextSize = {
  HeadingLarge: 'HeadingLarge',
  Heading: 'Heading',
  HeadingSmall: 'HeadingSmall',
  Paragraph: 'Paragraph',
} as const;

export type TSeventySevenTextSize =
  (typeof SeventySevenTextSize)[keyof typeof SeventySevenTextSize];

export const SeventySevenTextAlignment = {
  Left: 'Left',
  Center: 'Center',
  Right: 'Right',
  Justify: 'Justify',
} as const;

export type TSeventySevenTextAlignment =
  (typeof SeventySevenTextAlignment)[keyof typeof SeventySevenTextAlignment];

export const SeventySevenText = styled(Text, {
  name: 'SeventySevenText',
  variants: {
    size: {
      HeadingLarge: {
        fontSize: '$10',
        fontWeight: '700',
        lineHeight: '$10',
      },
      Heading: {
        fontSize: '$8',
        fontWeight: '700',
        lineHeight: '$8',
      },
      HeadingSmall: {
        fontSize: '$6',
        fontWeight: '700',
        lineHeight: '$7',
      },
      Paragraph: {
        fontSize: '$4',
        fontWeight: '400',
        lineHeight: '$5',
      },
    },
    severity: {
      Default: {
        color: '$color',
      },
      Info: {
        color: '$blue11',
      },
      Success: {
        color: '$green11',
      },
      Warning: {
        color: '$yellow11',
      },
      Error: {
        color: '$red11',
      },
    },
    alignment: {
      Left: {
        textAlign: 'left',
      },
      Center: {
        textAlign: 'center',
      },
      Right: {
        textAlign: 'right',
      },
      Justify: {
        textAlign: 'justify',
      },
    },
    bold: {
      true: {
        fontWeight: '700',
      },
    },
    italic: {
      true: {
        fontStyle: 'italic',
      },
    },
  } as const,
  defaultVariants: {
    size: 'Paragraph',
    severity: Severity.Default,
    alignment: 'Left',
    bold: false,
    italic: false,
  },
});
