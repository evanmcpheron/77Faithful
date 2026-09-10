import type { ComponentProps } from 'react';
import { Text } from 'react-native';
import styled from 'styled-components/native';

import { TypographyColors, TypographyStyles } from '@td/theme/typography';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { ITypographyProps } from './typography.types';

type TTypographyStyleProps = Required<
	Pick<ITypographyProps, 'align' | 'size' | 'tone' | 'underline' | 'weight'>
>;

const FilteredText = withFilteredProps<
	ComponentProps<typeof Text>,
	TTypographyStyleProps
>(Text, ['align', 'size', 'tone', 'underline', 'weight']);

const getLineHeight = (value: number): number | string => `${value}px`;

export const StyledTypography = styled(FilteredText)<TTypographyStyleProps>(
	({ align, size, tone, underline, weight }) => ({
		color: TypographyColors[tone],
		fontSize: TypographyStyles[size].Size,
		fontWeight: weight === 'Semibold' ? '600' : weight.toLowerCase(),
		lineHeight: getLineHeight(TypographyStyles[size].LineHeight),
		textAlign: align,
		textDecorationLine: underline ? 'underline' : 'none',
	}),
);
