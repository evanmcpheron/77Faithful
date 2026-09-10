import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@td/providers/auth/auth.hook';

const AppLayout = () => {
	const { isAuthenticated, isInitializingSession } = useAuth();

	if (isInitializingSession) {
		return null;
	}

	if (!isAuthenticated) {
		return <Redirect href='/(auth)' />;
	}

	return <Stack screenOptions={{ headerShown: false }} />;
};

export default AppLayout;
