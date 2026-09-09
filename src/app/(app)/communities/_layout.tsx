import { Redirect, Stack } from 'expo-router';

import { featureFlags } from '@77/constants/feature-flags';

const CommunitiesLayout = () => {
  if (!featureFlags.areCommunitiesEnabled) {
    return <Redirect href="/today" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default CommunitiesLayout;
