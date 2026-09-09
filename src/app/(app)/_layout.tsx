import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@77/providers/auth-provider';

const AppLayout = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  if (!user.emailVerified) {
    return <Redirect href="/confirm-email" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default AppLayout;
