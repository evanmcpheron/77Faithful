import { Meta, StoryObj } from '@storybook/react-native';
import { CalendarWeek } from './calendar-week.component';

const meta = {
	title: 'UI/CalendarWeek',
	component: CalendarWeek,
	args: {},
	argTypes: {},
} satisfies Meta<typeof CalendarWeek>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
