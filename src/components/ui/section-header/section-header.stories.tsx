import type { Meta, StoryObj } from '@storybook/react-native';

import { SectionHeader } from './section-header.component';

const meta = {
	title: 'UI/SectionHeader',
	component: SectionHeader,
	args: {
		callToActionText: 'View All',
		title: 'Upcoming Jobs',
		onPress: () => undefined,
	},
	argTypes: {
		callToActionText: {
			control: { type: 'text' },
		},
		title: {
			control: { type: 'text' },
		},
	},
} satisfies Meta<typeof SectionHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
