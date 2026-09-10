import type { Meta, StoryObj } from '@storybook/react-native';

import { IconName } from '@td/components/ui/icon/icon.types';
import { ComponentTone } from '@td/types/ui.types';

import { ActionRow } from './action-row.component';
import { ActionRowVariant } from './action-row.types';

const meta = {
	title: 'UI/ActionRow',
	component: ActionRow,
	args: {
		description: 'Review property details and current job status.',
		disabled: false,
		leadingIconName: 'Home',
		title: 'Sunset Villa',
		trailingIconName: 'Arrow',
		tone: 'Brand',
		variant: 'Default',
		onPress: () => undefined,
	},
	argTypes: {
		description: {
			control: { type: 'text' },
		},
		leadingIconName: {
			options: Object.values(IconName),
			control: { type: 'select' },
		},
		title: {
			control: { type: 'text' },
		},
		tone: {
			options: Object.values(ComponentTone),
			control: { type: 'select' },
		},
		trailingIconName: {
			options: Object.values(IconName),
			control: { type: 'select' },
		},
		variant: {
			options: Object.values(ActionRowVariant),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof ActionRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Muted: Story = {
	args: {
		variant: 'Muted',
	},
};
