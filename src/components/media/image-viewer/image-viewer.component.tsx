import { AppImage } from '@td/components/media/app-image/app-image.component';
import { Typography } from '@td/components/ui/typography/typography.component';

import {
	StyledImageViewer,
	StyledImageViewerImage,
} from './image-viewer.styles';
import type { IImageViewerProps } from './image-viewer.types';

export const ImageViewer = ({
	accessibilityLabel,
	contentFit,
	source,
	testID,
	title,
}: IImageViewerProps) => {
	return (
		<StyledImageViewer testID={testID}>
			{title ? <Typography weight='Bold'>{title}</Typography> : null}
			<StyledImageViewerImage>
				<AppImage
					accessibilityLabel={accessibilityLabel ?? title}
					contentFit={contentFit}
					source={source}
				/>
			</StyledImageViewerImage>
		</StyledImageViewer>
	);
};
