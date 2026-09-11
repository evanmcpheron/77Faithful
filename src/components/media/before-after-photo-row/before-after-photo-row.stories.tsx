import type { Meta, StoryObj } from '@storybook/react-native';

import {
	mediaStoryPrimaryImageSource,
	mediaStorySecondaryImageSource,
} from '../media-component-story.fixtures';
import { BeforeAfterPhotoRow } from './before-after-photo-row.component';

const meta = {
	title: 'Media/BeforeAfterPhotoRow',
	component: BeforeAfterPhotoRow,
	args: {
		afterSource: mediaStorySecondaryImageSource,
		beforeSource: mediaStoryPrimaryImageSource,
	},
	argTypes: {
		afterSource: {
			control: { type: 'text' },
		},
		beforeSource: {
			control: { type: 'text' },
		},
	},
} satisfies Meta<typeof BeforeAfterPhotoRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
