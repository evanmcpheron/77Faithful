import type { Meta, StoryObj } from '@storybook/react-native';

import { CounterBadge } from './counter-badge.component';
import { CounterBadgeVariant } from './counter-badge.types';

const meta = {
	title: 'UI/CounterBadge',
	component: CounterBadge,
	args: {
		count: 8,
		maxCount: 99,
		variant: 'Default',
	},
	argTypes: {
		count: {
			min: 0,
			max: 150,
			step: 1,
		},
		maxCount: {
			min: 1,
			max: 150,
			step: 1,
		},
		variant: {
			options: Object.values(CounterBadgeVariant),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof CounterBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Overflow: Story = {
	args: {
		count: 120,
		maxCount: 99,
	},
};
