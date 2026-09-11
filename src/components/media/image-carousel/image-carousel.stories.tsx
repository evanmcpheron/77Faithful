import type { Meta, StoryObj } from '@storybook/react-native';

import { ImageThumbnailSize } from '../image-thumbnail/image-thumbnail.types';
import { mediaStoryImageSources } from '../media-component-story.fixtures';
import { ImageCarousel } from './image-carousel.component';

const meta = {
	title: 'Media/ImageCarousel',
	component: ImageCarousel,
	args: {
		accessibilityLabel: 'Carousel image',
		sources: mediaStoryImageSources,
		thumbnailSize: 'Large',
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
} satisfies Meta<typeof ImageCarousel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
