import { Pressable, PressableProps } from 'react-native';
import styled from 'styled-components/native';

import { BorderColors, NeutralColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Shadows } from '@td/theme/shadows';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { ICardProps } from './card.types';

type TCardStyleProps = Required<
	Pick<ICardProps, 'padding' | 'tone' | 'variant'>
>;

const getCardBackgroundColor = ({
	tone,
	variant,
}: Pick<TCardStyleProps, 'tone' | 'variant'>): string => {
	if (tone === 'Inverse') {
		return SurfaceColors.Inverse;
	}

	if (variant === 'Muted') {
		return SurfaceColors.Muted;
	}

	return NeutralColors.White;
};

const FilteredPressable = withFilteredProps<PressableProps, TCardStyleProps>(
	Pressable,
	['padding', 'tone', 'variant'],
);

export const StyledCard = styled(FilteredPressable)<TCardStyleProps>(
	({ padding, tone, variant }) => ({
		...Shadows.Card,
		gap: Spacing.Small,
		backgroundColor: getCardBackgroundColor({ tone, variant }),
		borderColor:
			variant === 'Outlined' ? BorderColors.Default : 'transparent',
		borderRadius: Radius.Large,
		borderWidth: variant === 'Outlined' ? 1 : 0,
		padding: padding,
	}),
);
