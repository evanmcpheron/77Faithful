import type { Meta, StoryObj } from '@storybook/react-native';

import { IconName } from '@td/components/ui/icon/icon.types';

import { ErrorState } from './error-state.component';

const meta = {
	title: 'UI/ErrorState',
	component: ErrorState,
	args: {
		iconName: 'XCircle',
		message: 'Unable to load the latest property data.',
		retryLabel: 'Try Again',
		title: 'Unable to load',
		onRetry: () => undefined,
	},
	argTypes: {
		iconName: {
			options: Object.values(IconName),
			control: { type: 'select' },
		},
		message: {
			control: { type: 'text' },
		},
		retryLabel: {
			control: { type: 'text' },
		},
		title: {
			control: { type: 'text' },
		},
	},
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
