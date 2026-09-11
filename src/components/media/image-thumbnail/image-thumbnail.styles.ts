import { View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';

import { BorderColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type {
	IImageThumbnailProps,
	TImageThumbnailSize,
} from './image-thumbnail.types';

type TStyledImageThumbnailProps = Required<Pick<IImageThumbnailProps, 'size'>>;

const ImageThumbnailSizes = {
	Small: 48,
	Medium: 72,
	Large: 96,
} satisfies Record<TImageThumbnailSize, number>;

const FilteredView = withFilteredProps<ViewProps, TStyledImageThumbnailProps>(
	View,
	['size'],
);

export const StyledImageThumbnail = styled(
	FilteredView,
)<TStyledImageThumbnailProps>(({ size }) => {
	const imageThumbnailSize = ImageThumbnailSizes[size];

	return {
		backgroundColor: SurfaceColors.Muted,
		borderColor: BorderColors.Subtle,
		borderRadius: Radius.Medium,
		borderWidth: 1,
		height: imageThumbnailSize,
		overflow: 'hidden',
		width: imageThumbnailSize,
	};
});
