import type { ImageContentFit, ImageSource } from 'expo-image';

export const ImageSize = {
	Small: 'Small',
	Medium: 'Medium',
	Large: 'Large',
};

export type TImageSize = (typeof ImageSize)[keyof typeof ImageSize];

export interface IAppImageProps {
	source?: ImageSource | string | number;
	contentFit?: ImageContentFit;
	size?: TImageSize;
	accessibilityLabel?: string;
	testID?: string;
}
