import type { Meta, StoryObj } from '@storybook/react-native';

import { mediaStoryPrimaryImageSource } from '../media-component-story.fixtures';
import { ImageThumbnail } from './image-thumbnail.component';
import { ImageThumbnailSize } from './image-thumbnail.types';

const meta = {
	title: 'Media/ImageThumbnail',
	component: ImageThumbnail,
	args: {
		accessibilityLabel: 'Property thumbnail',
		contentFit: 'cover',
		size: 'Medium',
		source: mediaStoryPrimaryImageSource,
	},
	argTypes: {
		accessibilityLabel: {
			control: { type: 'text' },
		},
		contentFit: {
			options: ['cover', 'contain', 'fill', 'none', 'scale-down'],
			control: { type: 'select' },
		},
		size: {
			options: Object.values(ImageThumbnailSize),
			control: { type: 'select' },
		},
		source: {
			control: { type: 'text' },
		},
	},
} satisfies Meta<typeof ImageThumbnail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Medium: Story = {};

export const Large: Story = {
	args: {
		size: 'Large',
	},
};

export const Empty: Story = {
	args: {
		source: undefined,
	},
};
