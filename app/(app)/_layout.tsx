import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

const AppLayout = () => {
	return <Stack screenOptions={{ headerShown: false }} />;
};

export default AppLayout;
