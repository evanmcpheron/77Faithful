import { View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';

import { FeedbackColors, NeutralColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { ICounterBadgeProps } from './counter-badge.types';

type TStyledCounterBadgeProps = Pick<ICounterBadgeProps, 'variant'>;

const FilteredView = withFilteredProps<ViewProps, TStyledCounterBadgeProps>(
	View,
	['variant'],
);

export const StyledCounterBadge = styled(
	FilteredView,
)<TStyledCounterBadgeProps>(({ variant = 'Default' }) => ({
	alignItems: 'center',
	backgroundColor:
		variant === 'Active'
			? FeedbackColors.ErrorMuted
			: variant === 'Brand'
				? SurfaceColors.Muted
				: NeutralColors.Grey200,
	borderRadius: Radius.Full,
	height: 22,
	justifyContent: 'center',
	minWidth: 22,
	paddingHorizontal: 6,
}));
