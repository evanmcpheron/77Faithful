import { AppImage } from '@td/components/media/app-image/app-image.component';

import { StyledImageThumbnail } from './image-thumbnail.styles';
import {
	ImageThumbnailSize,
	type IImageThumbnailProps,
} from './image-thumbnail.types';

export const ImageThumbnail = ({
	accessibilityLabel,
	contentFit,
	size = ImageThumbnailSize.Medium,
	source,
	testID,
}: IImageThumbnailProps) => {
	return (
		<StyledImageThumbnail
			accessibilityLabel={accessibilityLabel}
			accessibilityRole='image'
			accessible={Boolean(accessibilityLabel)}
			size={size}
			testID={testID}
		>
			{source ? (
				<AppImage
					contentFit={contentFit}
					source={source}
				/>
			) : null}
		</StyledImageThumbnail>
	);
};
