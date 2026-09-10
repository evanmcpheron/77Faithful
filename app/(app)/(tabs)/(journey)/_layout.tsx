import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'journey' };

const JourneyLayout = () => {
	return <Stack screenOptions={{ headerShown: false }} />;
};

export default JourneyLayout;
