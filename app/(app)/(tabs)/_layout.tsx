import { TabsLayout } from '@td/components/layout/navigation/navigation.component';
import { APP_TABS } from '@td/components/layout/navigation/navigation.utils';
import { useJourneyAccess } from '@td/providers/journey/journey-access.provider';

export const unstable_settings = { initialRouteName: 'today' };

const AppTabsLayout = () => {
	const { hasJourney } = useJourneyAccess();
	const tabs = APP_TABS.map((tab) =>
		tab.name === 'today' || tab.name === '(journey)'
			? { ...tab, enabled: hasJourney }
			: tab,
	);
	return <TabsLayout tabs={tabs} />;
};

export default AppTabsLayout;
