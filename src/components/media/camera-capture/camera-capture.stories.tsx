import type { Meta, StoryObj } from '@storybook/react-native';

import { handleMediaStorybookAction } from '../media-component-story.fixtures';
import { CameraCapture } from './camera-capture.component';

const meta = {
	title: 'Media/CameraCapture',
	component: CameraCapture,
	args: {
		label: 'Take Photo',
		onCapture: handleMediaStorybookAction,
	},
	argTypes: {
		label: {
			control: { type: 'text' },
		},
	},
} satisfies Meta<typeof CameraCapture>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
