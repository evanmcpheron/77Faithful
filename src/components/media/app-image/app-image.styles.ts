import { Image } from 'expo-image';
import styled from 'styled-components/native';

import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { withFilteredProps } from '@td/utils/styles/styles.util';
import { IAppImageProps, ImageSize, TImageSize } from './app-image.types';

type TStyledAppImageProps = Required<Pick<IAppImageProps, 'size'>>;

const getMaxHeight = (size: TImageSize) => {
	switch (size) {
		case ImageSize.Small:
			return 25;
		case ImageSize.Medium:
			return 225;
		case ImageSize.Large:
			return 10;
		default:
			return 225;
	}
};

const FilteredImage = withFilteredProps(Image, ['size']);

export const StyledAppImage = styled(FilteredImage)<TStyledAppImageProps>(
	({ size }) => ({
		backgroundColor: SurfaceColors.Muted,
		borderRadius: Radius.Medium,
		height: getMaxHeight(size),
		overflow: 'hidden',
		flex: 1,
		width: '100%',
	}),
);
