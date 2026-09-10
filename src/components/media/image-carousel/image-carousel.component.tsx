import { PhotoGrid } from '@td/components/media/photo-grid/photo-grid.component';

import type { IImageCarouselProps } from './image-carousel.types';

export const ImageCarousel = ({
	accessibilityLabel,
	sources,
	testID,
	thumbnailSize,
}: IImageCarouselProps) => {
	return (
		<PhotoGrid
			accessibilityLabel={accessibilityLabel}
			sources={sources}
			testID={testID}
			thumbnailSize={thumbnailSize}
		/>
	);
};
