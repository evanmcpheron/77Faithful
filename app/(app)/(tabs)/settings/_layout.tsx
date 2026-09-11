import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'index' };

const SettingsLayout = () => {
	return <Stack screenOptions={{ headerShown: false }} />;
};

export default SettingsLayout;
