import { Pressable, type PressableProps } from 'react-native';
import styled from 'styled-components/native';

import {
	ActionColors,
	BorderColors,
	BrandColors,
	FeedbackColors,
	NeutralColors,
	SurfaceColors,
} from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { IChipProps } from './chip.types';

type TChipStyleProps = Required<
	Pick<IChipProps, 'disabled' | 'selected' | 'tone' | 'variant'>
>;

const getChipBorderColor = ({
	selected,
	tone,
}: Pick<TChipStyleProps, 'selected' | 'tone'>): string => {
	if (!selected) {
		return BorderColors.Muted;
	}

	if (tone === 'Brand') return BrandColors.Primary;
	if (tone === 'Success') return FeedbackColors.Success;
	if (tone === 'Warning') return FeedbackColors.Warning;
	if (tone === 'Error') return FeedbackColors.Error;
	if (tone === 'Info') return FeedbackColors.Info;
	if (tone === 'Inverse') return BorderColors.Inverse;

	return BorderColors.Default;
};

const getChipBackgroundColor = ({
	selected,
	tone,
	variant,
}: Pick<TChipStyleProps, 'selected' | 'tone' | 'variant'>): string => {
	if (variant === 'Outline' && !selected) {
		return 'transparent';
	}

	if (!selected) {
		return NeutralColors.White;
	}

	if (tone === 'Inverse') {
		return SurfaceColors.Inverse;
	}

	return SurfaceColors.Muted;
};

const FilteredPressable = withFilteredProps<PressableProps, TChipStyleProps>(
	Pressable,
	['selected', 'tone', 'variant'],
);

export const StyledChip = styled(FilteredPressable)<TChipStyleProps>(
	({ disabled, selected, tone, variant }) => ({
		alignItems: 'center',
		backgroundColor: getChipBackgroundColor({ selected, tone, variant }),
		borderColor: getChipBorderColor({ selected, tone }),
		borderRadius: Radius.Full,
		borderWidth: 1,
		flexDirection: 'row',
		gap: Spacing.XSmall,
		opacity: disabled ? ActionColors.DisabledOpacity : 1,
		paddingHorizontal: Spacing.Small,
		paddingVertical: Spacing.XSmall,
	}),
);
