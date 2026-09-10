import { TabsLayout } from '@td/components/layout/navigation/navigation.component';
import { APP_TABS } from '@td/components/layout/navigation/navigation.utils';

export const unstable_settings = { initialRouteName: 'today' };

const AppTabsLayout = () => {
	return <TabsLayout tabs={APP_TABS} />;
};

export default AppTabsLayout;
