import type { Meta, StoryObj } from '@storybook/react-native';

import { mediaStoryPrimaryImageSource } from '../media-component-story.fixtures';
import { ImageViewer } from './image-viewer.component';

const meta = {
	title: 'Media/ImageViewer',
	component: ImageViewer,
	args: {
		accessibilityLabel: 'Property hero image',
		contentFit: 'cover',
		source: mediaStoryPrimaryImageSource,
		title: 'Antilia Commercial Park',
	},
	argTypes: {
		accessibilityLabel: {
			control: { type: 'text' },
		},
		contentFit: {
			options: ['cover', 'contain', 'fill', 'none', 'scale-down'],
			control: { type: 'select' },
		},
		source: {
			control: { type: 'text' },
		},
		title: {
			control: { type: 'text' },
		},
	},
} satisfies Meta<typeof ImageViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutTitle: Story = {
	args: {
		title: undefined,
	},
};
