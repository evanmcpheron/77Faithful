import { View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';

import { BorderColors, NeutralColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { ISurfaceProps } from './surface.types';

type TStyledSurfaceProps = Required<Pick<ISurfaceProps, 'padding' | 'variant'>>;

const FilteredView = withFilteredProps<ViewProps, TStyledSurfaceProps>(View, [
	'padding',
	'variant',
]);

export const StyledSurface = styled(FilteredView)<TStyledSurfaceProps>(
	({ padding, variant }) => ({
		backgroundColor:
			variant === 'Brand'
				? SurfaceColors.Accent
				: variant === 'Muted'
					? SurfaceColors.Muted
					: NeutralColors.White,
		borderColor:
			variant === 'Muted' ? NeutralColors.Grey200 : BorderColors.Subtle,
		borderRadius: Radius.Medium,
		borderWidth: 1,
		padding:
			padding === 'Medium'
				? Spacing.Small
				: padding === 'Small'
					? Spacing.XSmall
					: 0,
	}),
);
