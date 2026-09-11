import type { Meta, StoryObj } from '@storybook/react-native';

import { Typography } from '@td/components/ui/typography/typography.component';

import { Divider } from './divider.component';

const meta = {
	title: 'UI/Divider',
	component: Divider,
	args: {
		thickness: 'Line',
	},
	render: (args) => (
		<>
			<Typography>Above divider</Typography>
			<Divider {...args} />
			<Typography>Below divider</Typography>
		</>
	),
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
