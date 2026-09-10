import { StyleSheet } from 'react-native';

import { TypographySize, TypographyWeight } from '@td/theme/typography';
import { StyledTypography } from './typography.styles';
import type { ITypographyProps } from './typography.types';

export const Typography = ({
	align,
	children,
	numberOfLines,
	size = TypographySize.Body,
	style,
	testID,
	tone,
	underline = false,
	weight = TypographyWeight.Regular,
}: ITypographyProps) => {
	const resolvedAlign = align ?? 'left';
	const resolvedTone = tone ?? 'Primary';
	const flattenedStyle = StyleSheet.flatten(style);

	return (
		<StyledTypography
			align={resolvedAlign}
			numberOfLines={numberOfLines}
			size={size}
			style={flattenedStyle}
			testID={testID}
			tone={resolvedTone}
			underline={underline}
			weight={weight}
		>
			{children}
		</StyledTypography>
	);
};
