import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'index' };

const CommunitiesLayout = () => {
	return <Stack screenOptions={{ headerShown: false }} />;
};

export default CommunitiesLayout;
