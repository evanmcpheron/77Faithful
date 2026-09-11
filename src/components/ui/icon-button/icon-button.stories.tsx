import type { Meta, StoryObj } from '@storybook/react-native';

import { IconName } from '@td/components/ui/icon/icon.types';
import { IconSizes } from '@td/theme/icon-sizes';
import { ComponentSize, ComponentTone } from '@td/types/ui.types';

import { IconButton } from './icon-button.component';
import { IconButtonVariant } from './icon-button.types';

const meta = {
	title: 'UI/IconButton',
	component: IconButton,
	args: {
		accessibilityLabel: 'Open settings',
		disabled: false,
		iconSize: IconSizes.Medium,
		name: 'Settings',
		size: 'Medium',
		tone: 'Brand',
		variant: 'Soft',
		onPress: () => undefined,
	},
	argTypes: {
		iconSize: {
			options: Object.values(IconSizes),
			control: { type: 'select' },
		},
		name: {
			options: Object.values(IconName),
			control: { type: 'select' },
		},
		size: {
			options: Object.values(ComponentSize),
			control: { type: 'select' },
		},
		tone: {
			options: Object.values(ComponentTone),
			control: { type: 'select' },
		},
		variant: {
			options: Object.values(IconButtonVariant),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Soft: Story = {};

export const Ghost: Story = {
	args: {
		name: 'BellNotification',
		variant: 'Ghost',
	},
};
