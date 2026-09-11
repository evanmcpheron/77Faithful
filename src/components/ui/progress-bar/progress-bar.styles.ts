import { View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';

import { BrandColors, NeutralColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

interface IProgressBarFillStyleProps {
	progressPercent: number;
}

const FilteredView = withFilteredProps<ViewProps, IProgressBarFillStyleProps>(
	View,
	['progressPercent'],
);

export const StyledProgressBar = styled.View({
	gap: Spacing.XSmall,
});

export const StyledProgressBarTrack = styled.View({
	backgroundColor: NeutralColors.Grey200,
	borderRadius: Radius.Full,
	height: 8,
	overflow: 'hidden',
});

export const StyledProgressBarFill = styled(
	FilteredView,
)<IProgressBarFillStyleProps>(({ progressPercent }) => ({
	backgroundColor: BrandColors.Secondary,
	borderRadius: Radius.Full,
	height: '100%',
	width: `${progressPercent}%`,
}));
