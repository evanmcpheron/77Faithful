import type { Meta, StoryObj } from '@storybook/react-native';

import { Status } from '@td/types/global.types';
import { StatusBadge } from './status-badge.component';

const meta = {
	title: 'UI/StatusBadge',
	component: StatusBadge,
	args: {
		label: undefined,
		status: 'Pending',
	},
	argTypes: {
		label: {
			control: { type: 'text' },
		},
		status: {
			options: Object.values(Status),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof StatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Pending: Story = {};

export const Completed: Story = {
	args: {
		status: 'Completed',
	},
};
