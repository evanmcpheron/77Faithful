import type { Meta, StoryObj } from '@storybook/react-native';

import { Typography } from '@td/components/ui/typography/typography.component';
import { Spacing } from '@td/theme/spacing';

import { Spacer } from './spacer.component';

const meta = {
	title: 'UI/Spacer',
	component: Spacer,
	args: {
		size: Spacing.Small,
	},
	argTypes: {
		size: {
			options: Object.values(Spacing),
			control: { type: 'select' },
		},
	},
	render: (args) => (
		<>
			<Typography>Above spacer</Typography>
			<Spacer {...args} />
			<Typography>Below spacer</Typography>
		</>
	),
} satisfies Meta<typeof Spacer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
