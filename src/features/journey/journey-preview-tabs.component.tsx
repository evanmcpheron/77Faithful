import { NavigationContainer, NavigationIndependentTree } from 'expo-router/react-navigation';
import { createBottomTabNavigator } from 'expo-router/tabs';

import { SeventySevenScreenPlaceholder } from '@77/components/core';
import { SeventySevenTabScreen } from '@77/components/navigation/seventy-seven-tab-screen.component';
import { featureFlags } from '@77/constants/feature-flags';
import { SettingsScreen } from '@77/features/account/settings-screen.component';
import { useMainTabOptions } from '@77/features/navigation/use-main-tab-options.hook';

import { JourneyScreen } from './journey-screen.component';
import { TodayScreen } from './today-screen.component';
import type { TTodayJourney } from './today-screen.component';

interface IJourneyPreviewTabsProps {
  userId: string;
  previewJourney: TTodayJourney;
  onExitPreview: () => void;
}

const PreviewTabs = createBottomTabNavigator();

export const JourneyPreviewTabs = ({
  userId,
  previewJourney,
  onExitPreview,
}: IJourneyPreviewTabsProps) => {
  const options = useMainTabOptions();

  if (!__DEV__) return null;

  // Preview navigation stays local so it cannot bypass the committed-journey route guard.
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <PreviewTabs.Navigator
          initialRouteName="today"
          backBehavior="initialRoute"
          screenOptions={options.screenOptions}
          screenLayout={({ children }) => <SeventySevenTabScreen>{children}</SeventySevenTabScreen>}
        >
          <PreviewTabs.Screen name="today" options={options.today}>
            {() => (
              <TodayScreen
                userId={userId}
                previewJourney={previewJourney}
                onExitPreview={onExitPreview}
              />
            )}
          </PreviewTabs.Screen>
          <PreviewTabs.Screen name="journey" options={options.journey}>
            {() => (
              <JourneyScreen
                userId={userId}
                previewJourney={previewJourney}
                onExitPreview={onExitPreview}
              />
            )}
          </PreviewTabs.Screen>
          {featureFlags.areCommunitiesEnabled ? (
            <PreviewTabs.Screen name="communities" options={options.communities}>
              {() => <SeventySevenScreenPlaceholder title="Communities" />}
            </PreviewTabs.Screen>
          ) : null}
          <PreviewTabs.Screen
            name="settings"
            options={options.settings}
            component={SettingsScreen}
          />
        </PreviewTabs.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};
