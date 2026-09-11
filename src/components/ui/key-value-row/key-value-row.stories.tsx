import type { Meta, StoryObj } from '@storybook/react-native';

import { IconName } from '@td/components/ui/icon/icon.types';

import { KeyValueRow } from './key-value-row.component';

const meta = {
	title: 'UI/KeyValueRow',
	component: KeyValueRow,
	args: {
		iconName: 'Mail',
		label: 'Guest Email',
		value: 'guest@example.com',
	},
	argTypes: {
		iconName: {
			options: Object.values(IconName),
			control: { type: 'select' },
		},
		label: {
			control: { type: 'text' },
		},
		value: {
			control: { type: 'text' },
		},
	},
} satisfies Meta<typeof KeyValueRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
