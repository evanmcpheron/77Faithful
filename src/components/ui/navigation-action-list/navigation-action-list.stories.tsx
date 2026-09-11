import type { Meta, StoryObj } from '@storybook/react-native';

import { IconName } from '@td/components/ui/icon/icon.types';

import { NavigationActionList } from './navigation-action-list.component';
import type { INavigationActionListItem } from './navigation-action-list.types';

const navigationActionListItems = [
	{
		id: 'company-profile',
		title: 'Company Profile',
		iconName: IconName.Identification,
		onPress: () => undefined,
	},
	{
		id: 'internal-team',
		title: 'Internal Team',
		iconName: IconName.Users,
		onPress: () => undefined,
	},
	{
		id: 'connected-service-provider',
		title: 'Connected Service Provider',
		iconName: IconName.TwoHandsGear,
		onPress: () => undefined,
	},
	{
		id: 'service-provider-request',
		title: 'Service Provider Request',
		iconName: IconName.HandGear,
		onPress: () => undefined,
	},
] satisfies INavigationActionListItem[];

const meta = {
	title: 'UI/NavigationActionList',
	component: NavigationActionList,
	args: {
		actions: navigationActionListItems,
	},
} satisfies Meta<typeof NavigationActionList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
