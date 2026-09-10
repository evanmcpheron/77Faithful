import type { Meta, StoryObj } from '@storybook/react-native';

import { IconName } from '@td/components/ui/icon/icon.types';

import { EmptyState } from './empty-state.component';

const meta = {
	title: 'UI/EmptyState',
	component: EmptyState,
	args: {
		actionLabel: 'Create Property',
		description:
			'Add your first property to start building your turnover workflow.',
		iconName: 'Home',
		title: 'No properties yet',
		onActionPress: () => undefined,
	},
	argTypes: {
		actionLabel: {
			control: { type: 'text' },
		},
		description: {
			control: { type: 'text' },
		},
		iconName: {
			options: Object.values(IconName),
			control: { type: 'select' },
		},
		title: {
			control: { type: 'text' },
		},
	},
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
