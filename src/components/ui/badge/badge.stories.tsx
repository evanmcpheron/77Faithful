import type { Meta, StoryObj } from '@storybook/react-native';

import { ComponentTone } from '@td/types/ui.types';

import { Badge } from './badge.component';
import { BadgeVariant } from './badge.types';

const meta = {
	title: 'UI/Badge',
	component: Badge,
	args: {
		children: 'Ready',
		tone: 'Brand',
		variant: 'Soft',
	},
	argTypes: {
		children: {
			control: { type: 'text' },
		},
		tone: {
			options: Object.values(ComponentTone),
			control: { type: 'select' },
		},
		variant: {
			options: Object.values(BadgeVariant),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Success: Story = {
	args: {
		children: 'Completed',
		tone: 'Success',
	},
};
