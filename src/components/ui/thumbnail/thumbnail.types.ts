import type { TIconName } from '@td/components/ui/icon/icon.types';

export const ThumbnailSize = {
	Small: 'Small',
	Medium: 'Medium',
	Large: 'Large',
} as const;

export type TThumbnailSize = (typeof ThumbnailSize)[keyof typeof ThumbnailSize];

export interface IThumbnailProps {
	imageUrl?: string;
	fallbackIconName?: TIconName;
	accessibilityLabel?: string;
	size?: TThumbnailSize;
	testID?: string;
}
