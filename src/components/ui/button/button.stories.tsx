import type { Meta, StoryObj } from '@storybook/react-native';

import { ComponentTone, TextAlign } from '@td/types/ui.types';

import { TurndownButton } from './button.component';
import { ButtonSize, ButtonVariant } from './button.types';

const meta = {
	title: 'UI/TurndownButton',
	component: TurndownButton,
	args: {
		align: 'center',
		children: 'Save Changes',
		disabled: false,
		fullWidth: true,
		size: 'Medium',
		tone: 'Brand',
		variant: 'Solid',
		onPress: () => undefined,
	},
	argTypes: {
		align: {
			options: Object.values(TextAlign),
			control: { type: 'select' },
		},
		children: {
			control: { type: 'text' },
		},
		size: {
			options: Object.values(ButtonSize),
			control: { type: 'select' },
		},
		tone: {
			options: Object.values(ComponentTone),
			control: { type: 'select' },
		},
		variant: {
			options: Object.values(ButtonVariant),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof TurndownButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Solid: Story = {};

export const Outline: Story = {
	args: {
		children: 'Cancel',
		variant: 'Outline',
	},
};

export const Link: Story = {
	args: {
		align: 'right',
		children: 'View All',
		fullWidth: false,
		variant: 'Link',
	},
};
