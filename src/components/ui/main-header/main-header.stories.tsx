import type { Meta, StoryObj } from '@storybook/react-native';

import { MainHeader } from './main-header.component';

const meta = {
	title: 'UI/MainHeader',
	component: MainHeader,
	args: {
		description: 'Your property, your control.',
		title: 'Properties',
	},
	argTypes: {
		description: {
			control: { type: 'text' },
		},
		title: {
			control: { type: 'text' },
		},
	},
	render: (args) => <MainHeader {...args} />,
} satisfies Meta<typeof MainHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
