import type { Meta, StoryObj } from '@storybook/react-native';

import { BadgeVariant } from '@td/components/ui/badge/badge.types';

import { Tag } from './tag.component';

const meta = {
	title: 'UI/Tag',
	component: Tag,
	args: {
		children: 'Kitchen',
		variant: BadgeVariant.Soft,
	},
	argTypes: {
		children: {
			control: { type: 'text' },
		},
		variant: {
			options: Object.values(BadgeVariant),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
