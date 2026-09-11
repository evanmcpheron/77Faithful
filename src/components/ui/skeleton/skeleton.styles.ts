import { View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';

import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { ISkeletonProps } from './skeleton.types';

type TStyledSkeletonProps = Required<
	Pick<ISkeletonProps, 'height' | 'variant' | 'width'>
>;

const FilteredView = withFilteredProps<ViewProps, TStyledSkeletonProps>(View, [
	'height',
	'variant',
	'width',
]);

export const StyledSkeleton = styled(FilteredView).attrs<TStyledSkeletonProps>(
	({ height, width }) => ({ style: { height, width } }),
)<TStyledSkeletonProps>(({ variant }) => ({
	backgroundColor: SurfaceColors.Muted,
	borderRadius: variant === 'Circle' ? Radius.Full : Radius.Small,
}));
