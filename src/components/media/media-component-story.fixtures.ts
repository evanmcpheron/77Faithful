import type { IAppImageProps } from '@td/components/media/app-image/app-image.types';

export const mediaStoryImageSources: NonNullable<IAppImageProps['source']>[] = [
	'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900',
	'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900',
	'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900',
	'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900',
];

export const mediaStoryPrimaryImageSource = mediaStoryImageSources[0];
export const mediaStorySecondaryImageSource = mediaStoryImageSources[1];

export const handleMediaStorybookAction = () => undefined;
