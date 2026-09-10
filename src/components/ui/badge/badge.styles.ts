import { View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';

import {
	BorderColors,
	BrandColors,
	FeedbackColors,
	NeutralColors,
	SurfaceColors,
} from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import type { TComponentTone } from '@td/types/ui.types';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { IBadgeProps, TBadgeVariant } from './badge.types';

type TBadgeStyleProps = Required<Pick<IBadgeProps, 'tone' | 'variant'>>;

const getBadgeBackgroundColor = ({
	tone,
	variant,
}: {
	tone: TComponentTone;
	variant: TBadgeVariant;
}): string => {
	if (variant === 'Outline') {
		return 'transparent';
	}

	if (variant === 'Solid') {
		if (tone === 'Brand') return BrandColors.Primary;
		if (tone === 'Neutral') return NeutralColors.Grey700;
		if (tone === 'Inverse') return SurfaceColors.Inverse;
		return FeedbackColors[tone];
	}

	if (tone === 'Success') return FeedbackColors.SuccessMuted;
	if (tone === 'Warning') return FeedbackColors.WarningMuted;
	if (tone === 'Error') return FeedbackColors.ErrorMuted;
	if (tone === 'Info') return FeedbackColors.InfoMuted;
	if (tone === 'Inverse') return SurfaceColors.Inverse;
	if (tone === 'Neutral') return NeutralColors.Grey100;

	return SurfaceColors.Muted;
};

const getBadgeBorderColor = (tone: TComponentTone): string => {
	if (tone === 'Success') return FeedbackColors.Success;
	if (tone === 'Warning') return FeedbackColors.Warning;
	if (tone === 'Error') return FeedbackColors.Error;
	if (tone === 'Info') return FeedbackColors.Info;
	if (tone === 'Inverse') return BorderColors.Inverse;
	if (tone === 'Brand') return BrandColors.Primary;

	return BorderColors.Muted;
};

const FilteredView = withFilteredProps<ViewProps, TBadgeStyleProps>(View, [
	'tone',
	'variant',
]);

export const StyledBadge = styled(FilteredView)<TBadgeStyleProps>(
	({ tone, variant }) => ({
		alignItems: 'center',
		alignSelf: 'flex-start',
		backgroundColor: getBadgeBackgroundColor({ tone, variant }),
		borderColor:
			variant === 'Outline' ? getBadgeBorderColor(tone) : 'transparent',
		borderRadius: Radius.Small,
		borderWidth: variant === 'Outline' ? 1 : 0,
		justifyContent: 'center',
		paddingHorizontal: Spacing.XSmall,
		paddingVertical: 4,
	}),
);
