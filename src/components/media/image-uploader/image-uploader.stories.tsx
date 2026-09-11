import type { Meta, StoryObj } from '@storybook/react-native';

import { handleMediaStorybookAction } from '../media-component-story.fixtures';
import { ImageUploader } from './image-uploader.component';

const meta = {
	title: 'Media/ImageUploader',
	component: ImageUploader,
	args: {
		label: 'Upload Photo',
		onPress: handleMediaStorybookAction,
	},
	argTypes: {
		label: {
			control: { type: 'text' },
		},
	},
} satisfies Meta<typeof ImageUploader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
