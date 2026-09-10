import { Input } from '@td/components/form/input/input.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Spacer } from '@td/components/ui/spacer/spacer.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { Spacing } from '@td/theme/spacing';
import { useNavigation } from 'expo-router';
import { View } from 'react-native';

export const ResetPasswordScreen = () => {
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
			<View>
				<Typography size='Display'>Welcome Back</Typography>
				<Spacer size={Spacing.XSmall} />
				<Typography tone='Disabled'>
					Enter your credentials to continue
				</Typography>
				<Spacer size={Spacing.Large} />

				<Input
					label='Email'
					type='Email'
					placeholder='example@email.com'
					icon={IconName.Mail}
				/>

				<Spacer size={Spacing.Large} />

				<TurndownButton
					disabled
					onPress={() => {}}
				>
					Login
				</TurndownButton>
			</View>
		</View>
	);
};
