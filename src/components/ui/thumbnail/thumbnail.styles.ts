import { Image, View, type ImageProps, type ViewProps } from 'react-native';
import styled from 'styled-components/native';

import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { IThumbnailProps, TThumbnailSize } from './thumbnail.types';

type TStyledThumbnailProps = Required<Pick<IThumbnailProps, 'size'>>;

const THUMBNAIL_SIZES: Record<TThumbnailSize, number> = {
	Small: 48,
	Medium: 72,
	Large: 96,
};

const FilteredView = withFilteredProps<ViewProps, TStyledThumbnailProps>(View, [
	'size',
]);

const FilteredImage = withFilteredProps<ImageProps, TStyledThumbnailProps>(
	Image,
	['size'],
);

export const StyledThumbnail = styled(FilteredView)<TStyledThumbnailProps>(({
	size,
}) => {
	const thumbnailSize = THUMBNAIL_SIZES[size];

	return {
		alignItems: 'center',
		backgroundColor: SurfaceColors.Muted,
		borderRadius: Radius.Medium,
		height: thumbnailSize,
		justifyContent: 'center',
		overflow: 'hidden',
		width: thumbnailSize,
	};
});

export const StyledThumbnailImage = styled(
	FilteredImage,
)<TStyledThumbnailProps>(({ size }) => {
	const thumbnailSize = THUMBNAIL_SIZES[size];

	return {
		height: thumbnailSize,
		width: thumbnailSize,
	};
});
