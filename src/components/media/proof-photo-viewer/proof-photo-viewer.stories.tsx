import type { Meta, StoryObj } from '@storybook/react-native';

import { mediaStoryPrimaryImageSource } from '../media-component-story.fixtures';
import { ProofPhotoViewer } from './proof-photo-viewer.component';

const meta = {
	title: 'Media/ProofPhotoViewer',
	component: ProofPhotoViewer,
	args: {
		accessibilityLabel: 'Completed task proof photo',
		contentFit: 'cover',
		source: mediaStoryPrimaryImageSource,
		title: 'Proof Photo',
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
} satisfies Meta<typeof ProofPhotoViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
