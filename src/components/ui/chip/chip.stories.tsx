import type { Meta, StoryObj } from '@storybook/react-native';

import { IconName } from '@td/components/ui/icon/icon.types';
import { ComponentTone } from '@td/types/ui.types';

import { Chip } from './chip.component';
import { ChipVariant } from './chip.types';

const meta = {
	title: 'UI/Chip',
	component: Chip,
	args: {
		children: 'Property',
		disabled: false,
		iconName: 'Home',
		selected: false,
		tone: 'Brand',
		variant: 'Soft',
		onPress: () => undefined,
	},
	argTypes: {
		children: {
			control: { type: 'text' },
		},
		iconName: {
			options: Object.values(IconName),
			control: { type: 'select' },
		},
		tone: {
			options: Object.values(ComponentTone),
			control: { type: 'select' },
		},
		variant: {
			options: Object.values(ChipVariant),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
	args: {
		selected: true,
		tone: 'Brand',
	},
};
