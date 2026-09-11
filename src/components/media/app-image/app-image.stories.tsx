import type { Meta, StoryObj } from '@storybook/react-native';

import { mediaStoryPrimaryImageSource } from '../media-component-story.fixtures';
import { StyledMediaStoryFrame } from '../media-story.styles';
import { AppImage } from './app-image.component';

const meta = {
	title: 'Media/AppImage',
	component: AppImage,
	args: {
		accessibilityLabel: 'Property image',
		contentFit: 'cover',
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
		source: {
			control: { type: 'text' },
		},
	},
	render: (args) => (
		<StyledMediaStoryFrame>
			<AppImage {...args} />
		</StyledMediaStoryFrame>
	),
} satisfies Meta<typeof AppImage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Contained: Story = {
	args: {
		contentFit: 'contain',
	},
};
