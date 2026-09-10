import type { Meta, StoryObj } from '@storybook/react-native';

import { ImageThumbnailSize } from '../image-thumbnail/image-thumbnail.types';
import { mediaStoryImageSources } from '../media-component-story.fixtures';
import { PhotoGrid } from './photo-grid.component';

const meta = {
	title: 'Media/PhotoGrid',
	component: PhotoGrid,
	args: {
		accessibilityLabel: 'Property photo',
		sources: mediaStoryImageSources,
		thumbnailSize: 'Medium',
	},
	argTypes: {
		accessibilityLabel: {
			control: { type: 'text' },
		},
		sources: {
			control: false,
		},
		thumbnailSize: {
			options: Object.values(ImageThumbnailSize),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof PhotoGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LargeThumbnails: Story = {
	args: {
		thumbnailSize: 'Large',
	},
};
