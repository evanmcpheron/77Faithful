import type { Meta, StoryObj } from '@storybook/react-native';

import { Avatar } from './avatar.component';
import { AvatarSize, AvatarVariant } from './avatar.types';

const meta = {
	title: 'UI/Avatar',
	component: Avatar,
	args: {
		accessibilityLabel: 'Evan Miller',
		initials: 'EM',
		size: 'Medium',
		variant: 'Default',
	},
	argTypes: {
		initials: {
			control: { type: 'text' },
		},
		size: {
			options: Object.values(AvatarSize),
			control: { type: 'select' },
		},
		variant: {
			options: Object.values(AvatarVariant),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Brand: Story = {
	args: {
		size: 'Large',
		variant: 'Brand',
	},
};
