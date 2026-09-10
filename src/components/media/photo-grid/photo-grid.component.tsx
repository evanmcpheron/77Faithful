import { ImageThumbnail } from '@td/components/media/image-thumbnail/image-thumbnail.component';

import { StyledPhotoGrid } from './photo-grid.styles';
import type { IPhotoGridProps } from './photo-grid.types';

export const PhotoGrid = ({
	accessibilityLabel,
	sources,
	testID,
	thumbnailSize,
}: IPhotoGridProps) => {
	return (
		<StyledPhotoGrid testID={testID}>
			{sources.map((source, index) => (
				<ImageThumbnail
					accessibilityLabel={
						accessibilityLabel
							? `${accessibilityLabel} ${index + 1}`
							: undefined
					}
					key={String(index)}
					size={thumbnailSize}
					source={source}
				/>
			))}
		</StyledPhotoGrid>
	);
};
