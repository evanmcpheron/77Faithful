import type { Meta, StoryObj } from '@storybook/react-native';

import { Skeleton } from './skeleton.component';
import { SkeletonVariant } from './skeleton.types';

const meta = {
	title: 'UI/Skeleton',
	component: Skeleton,
	args: {
		height: 72,
		variant: 'Block',
		width: '100%',
	},
	argTypes: {
		height: {
			min: 8,
			max: 160,
			step: 1,
		},
		variant: {
			options: Object.values(SkeletonVariant),
			control: { type: 'select' },
		},
		width: {
			control: { type: 'text' },
		},
	},
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Block: Story = {};

export const Circle: Story = {
	args: {
		variant: 'Circle',
		width: 48,
		height: 48,
	},
};
