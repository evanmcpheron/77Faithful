import { Tabs } from 'expo-router';

import { SeventySevenTabScreen } from '@77/components/navigation/seventy-seven-tab-screen.component';
import { featureFlags } from '@77/constants/feature-flags';
import { useMainTabOptions } from '@77/features/navigation/use-main-tab-options.hook';

export const unstable_settings = { initialRouteName: 'today' };

const MainTabsLayout = () => {
  const options = useMainTabOptions();

  return (
    <Tabs
      initialRouteName="today"
      backBehavior="initialRoute"
      screenLayout={({ children }) => <SeventySevenTabScreen>{children}</SeventySevenTabScreen>}
      screenOptions={options.screenOptions}
    >
      <Tabs.Screen name="today" options={options.today} />
      <Tabs.Screen name="(journey)" options={options.journey} />
      <Tabs.Screen
        name="communities"
        options={{
          ...options.communities,
          href: featureFlags.areCommunitiesEnabled ? '/communities' : null,
        }}
      />
      <Tabs.Screen name="settings" options={options.settings} />
    </Tabs>
  );
};

export default MainTabsLayout;
