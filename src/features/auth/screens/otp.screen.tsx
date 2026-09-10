import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { useNavigation } from 'expo-router';
import { View } from 'react-native';

export const OtpScreen = () => {
	const navigation = useNavigation();
	return (
		<View>
			<IconButton
				name={IconName.ArrowLeft}
				accessibilityLabel={''}
				onPress={() => {
					navigation.goBack();
				}}
			/>
		</View>
	);
};
