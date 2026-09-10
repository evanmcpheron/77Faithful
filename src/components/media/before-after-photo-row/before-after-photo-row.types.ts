import type { IAppImageProps } from '@td/components/media/app-image/app-image.types';

export interface IBeforeAfterPhotoRowProps {
	beforeSource?: IAppImageProps['source'];
	afterSource?: IAppImageProps['source'];
	testID?: string;
}
