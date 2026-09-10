import type { Meta, StoryObj } from '@storybook/react-native';

import { IconName } from '@td/components/ui/icon/icon.types';

import { Thumbnail } from './thumbnail.component';
import { ThumbnailSize } from './thumbnail.types';

const meta = {
	title: 'UI/Thumbnail',
	component: Thumbnail,
	args: {
		accessibilityLabel: 'Property thumbnail',
		fallbackIconName: 'Home',
		imageUrl: undefined,
		size: 'Medium',
	},
	argTypes: {
		fallbackIconName: {
			options: Object.values(IconName),
			control: { type: 'select' },
		},
		imageUrl: {
			control: { type: 'text' },
		},
		size: {
			options: Object.values(ThumbnailSize),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof Thumbnail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FallbackIcon: Story = {};
