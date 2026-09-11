import type { Meta, StoryObj } from '@storybook/react-native';

import { ProgressBar } from './progress-bar.component';

const meta = {
	title: 'UI/ProgressBar',
	component: ProgressBar,
	args: {
		label: 'Checklist Progress',
		max: 100,
		min: 0,
		showLabel: true,
		value: 64,
	},
	argTypes: {
		label: {
			control: { type: 'text' },
		},
		max: {
			min: 1,
			max: 200,
			step: 1,
		},
		min: {
			min: 0,
			max: 100,
			step: 1,
		},
		value: {
			min: 0,
			max: 100,
			step: 1,
			range: true,
		},
	},
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
