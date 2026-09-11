import type { Meta, StoryObj } from '@storybook/react-native';

import { Typography } from '@td/components/ui/typography/typography.component';

import { Surface } from './surface.component';
import { SurfacePadding, SurfaceVariant } from './surface.types';

const meta = {
	title: 'UI/Surface',
	component: Surface,
	args: {
		padding: 'Small',
		variant: 'Default',
	},
	argTypes: {
		padding: {
			options: Object.values(SurfacePadding),
			control: { type: 'select' },
		},
		variant: {
			options: Object.values(SurfaceVariant),
			control: { type: 'select' },
		},
	},
	render: (args) => (
		<Surface {...args}>
			<Typography>Surface content</Typography>
		</Surface>
	),
	parameters: {
		controls: {
			exclude: ['children'],
		},
	},
} satisfies Meta<typeof Surface>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Brand: Story = {
	args: {
		variant: 'Brand',
	},
};
