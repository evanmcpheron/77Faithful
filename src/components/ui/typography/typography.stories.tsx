import type { Meta, StoryObj } from '@storybook/react-native';

import {
	TypographySize,
	TypographyTone,
	TypographyWeight,
} from '@td/theme/typography';
import { TextAlign } from '@td/types/ui.types';
import { Typography } from './typography.component';

const meta = {
	title: 'UI/Typography',
	component: Typography,
	args: {
		children: 'Turnover management made simple.',
		size: TypographySize.Body,
		align: TextAlign.Left,
		tone: TypographyTone.Primary,
		underline: false,
		weight: TypographyWeight.Regular,
	},
	argTypes: {
		children: {
			control: { type: 'text' },
		},
		size: {
			options: Object.values(TypographySize),
			control: { type: 'select' },
		},
		align: {
			options: Object.values(TextAlign),
			control: { type: 'select' },
		},
		tone: {
			options: Object.values(TypographyTone),
			control: { type: 'select' },
		},
		weight: {
			options: Object.values(TypographyWeight),
			control: { type: 'select' },
		},
	},
} satisfies Meta<typeof Typography>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Body: Story = {};

export const Heading: Story = {
	args: {
		children: 'Dashboard',
		size: 'Display',
		weight: 'Bold',
	},
};
