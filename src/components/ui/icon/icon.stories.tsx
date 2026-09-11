import type { Meta, StoryObj } from '@storybook/react-native';

import { TextColors } from '@td/theme/colors';

import { AppIcon } from './icon.component';
import { IconName, IconVariant } from './icon.types';

const meta = {
	title: 'UI/AppIcon',
	component: AppIcon,
	args: {
		color: TextColors.Secondary,
		name: 'Home',
		size: 28,
		strokeWidth: 2.5,
		variant: IconVariant.Regular,
	},
	argTypes: {
		color: {
			control: { type: 'color' },
		},
		name: {
			options: Object.values(IconName),
			control: { type: 'select' },
		},
		size: {
			min: 12,
			max: 72,
			step: 1,
		},
		strokeWidth: {
			min: 1,
			max: 4,
			step: 0.25,
		},
		variant: {
			options: Object.values(IconVariant),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof AppIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
