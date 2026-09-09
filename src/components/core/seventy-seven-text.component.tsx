import { styled, Text } from 'tamagui';

import { Severity } from '@77/types';

export const SeventySevenTextSize = {
  HeadingLarge: 'HeadingLarge',
  Heading: 'Heading',
  HeadingSmall: 'HeadingSmall',
  Paragraph: 'Paragraph',
  CardTitle: 'CardTitle',
  Support: 'Support',
  Label: 'Label',
  Metadata: 'Metadata',
  Button: 'Button',
  Scripture: 'Scripture',
  Quotation: 'Quotation',
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
  fontFamily: '$body',
  allowFontScaling: true,
  variants: {
    size: {
      HeadingLarge: {
        fontFamily: '$heading',
        fontSize: '$hero',
        lineHeight: '$hero',
        fontWeight: '400',
      },
      Heading: {
        fontFamily: '$heading',
        fontSize: '$page',
        lineHeight: '$page',
        fontWeight: '400',
      },
      HeadingSmall: {
        fontFamily: '$heading',
        fontSize: '$section',
        lineHeight: '$section',
        fontWeight: '500',
      },
      Paragraph: {
        fontFamily: '$body',
        fontSize: '$body',
        lineHeight: '$body',
        fontWeight: '400',
      },
      CardTitle: {
        fontFamily: '$heading',
        fontSize: '$card',
        lineHeight: '$card',
        fontWeight: '500',
      },
      Support: {
        fontFamily: '$body',
        fontSize: '$support',
        lineHeight: '$support',
        fontWeight: '400',
      },
      Label: {
        fontFamily: '$body',
        fontSize: '$label',
        lineHeight: '$label',
        fontWeight: '500',
      },
      Metadata: {
        fontFamily: '$body',
        fontSize: '$metadata',
        lineHeight: '$metadata',
        fontWeight: '400',
      },
      Button: {
        fontFamily: '$body',
        fontSize: '$button',
        lineHeight: '$button',
        fontWeight: '600',
      },
      Scripture: {
        fontFamily: '$heading',
        fontSize: '$scripture',
        lineHeight: '$scripture',
        fontWeight: '400',
      },
      Quotation: {
        fontFamily: '$heading',
        fontSize: '$quotation',
        lineHeight: '$quotation',
        fontWeight: '400',
      },
    },
    severity: {
      Default: {
        color: '$color',
      },
      Info: {
        color: '$infoText',
      },
      Success: {
        color: '$successText',
      },
      Warning: {
        color: '$warningText',
      },
      Error: {
        color: '$errorText',
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
