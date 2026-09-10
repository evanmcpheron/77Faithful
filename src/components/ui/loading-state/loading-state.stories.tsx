import type { Meta, StoryObj } from '@storybook/react-native';

import { LoadingState } from './loading-state.component';
import { LoadingStateSize } from './loading-state.types';

const meta = {
	title: 'UI/LoadingState',
	component: LoadingState,
	args: {
		label: 'Loading properties...',
		size: 'Large',
	},
	argTypes: {
		label: {
			control: { type: 'text' },
		},
		size: {
			options: Object.values(LoadingStateSize),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof LoadingState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
