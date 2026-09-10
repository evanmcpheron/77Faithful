import type { IAppImageProps } from '@td/components/media/app-image/app-image.types';
export interface IImageViewerProps extends IAppImageProps {
	title?: string;
	onClose?: () => void;
}
