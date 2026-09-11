import type { IAppImageProps } from '@td/components/media/app-image/app-image.types';

export const ImageThumbnailSize = {
	Small: 'Small',
	Medium: 'Medium',
	Large: 'Large',
} as const;

export type TImageThumbnailSize =
	(typeof ImageThumbnailSize)[keyof typeof ImageThumbnailSize];

export interface IImageThumbnailProps extends IAppImageProps {
	size?: TImageThumbnailSize;
}
