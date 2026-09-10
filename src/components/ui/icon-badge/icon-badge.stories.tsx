import type { Meta, StoryObj } from '@storybook/react-native';

import { BrandColors, TextColors } from '@td/theme/colors';
import { IconSizes, IconStrokeWidths } from '@td/theme/icon-sizes';

import { IconName } from '@td/components/ui/icon/icon.types';

import { IconBadge } from './icon-badge.component';

const meta = {
	title: 'UI/IconBadge',
	component: IconBadge,
	args: {
		backgroundColor: BrandColors.Secondary,
		iconColor: TextColors.Secondary,
		iconSize: IconSizes.Medium,
		name: 'Home',
		strokeWidth: IconStrokeWidths.Regular,
	},
	argTypes: {
		backgroundColor: {
			control: { type: 'color' },
		},
		iconColor: {
			control: { type: 'color' },
		},
		iconSize: {
			options: Object.values(IconSizes),
			control: { type: 'select' },
		},
		name: {
			options: Object.values(IconName),
			control: { type: 'select' },
		},
		strokeWidth: {
			options: Object.values(IconStrokeWidths),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof IconBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
