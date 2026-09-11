import type { IAppImageProps } from '@td/components/media/app-image/app-image.types';
import type { TImageThumbnailSize } from '@td/components/media/image-thumbnail/image-thumbnail.types';

export interface IPhotoGridProps {
	sources: IAppImageProps['source'][];
	thumbnailSize?: TImageThumbnailSize;
	accessibilityLabel?: string;
	testID?: string;
}
