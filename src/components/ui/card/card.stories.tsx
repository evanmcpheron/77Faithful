import type { Meta, StoryObj } from '@storybook/react-native';

import { Typography } from '@td/components/ui/typography/typography.component';

import { Card } from './card.component';

const meta = {
	title: 'UI/Card',
	component: Card,
	args: {
		children: 'default',
	},
	argTypes: {
		children: {
			options: ['default'],
			mapping: {
				default: (
					<Typography
						size='Body'
						tone='Primary'
					>
						Use cards to group related content.
					</Typography>
				),
			},
			control: false,
		},
	},
	render: (args) => <Card>{args.children}</Card>,
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
