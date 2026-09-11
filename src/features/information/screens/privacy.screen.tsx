import { View } from 'react-native';

import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';

import { styles } from './information.styles';

export const PrivacyScreen = () => {
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			contentPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			keyboardEnabled={false}
			testID='privacy-screen'
		>
			<View style={styles.content}>
				<View style={styles.section}>
					<View accessibilityRole='header'>
						<Typography size='H1'>
							Your writing is private
						</Typography>
					</View>
					<Typography weight='Regular'>
						Your motivation, intentions, and reflections belong to
						your personal journey with Christ. They are not shared
						with other participants.
					</Typography>
				</View>
				<View style={styles.section}>
					<View accessibilityRole='header'>
						<Typography size='H2'>
							Information for your journey
						</Typography>
					</View>
					<Typography weight='Regular'>
						77Faithful uses your email address to manage your
						account. Your preferred name, practice choices, and
						journey records help you continue where you left off.
					</Typography>
					<Typography weight='Regular'>
						Writing is optional. You can take time to pray and
						reflect without recording your thoughts in the app.
					</Typography>
				</View>
				<View style={styles.section}>
					<View accessibilityRole='header'>
						<Typography size='H2'>
							Saving your information
						</Typography>
					</View>
					<Typography weight='Regular'>
						77Faithful uses Google Firebase for sign-in and to store
						information saved to your account. Private writing saved
						to your account is stored with the service; it is not
						kept only on your device.
					</Typography>
				</View>
				<View style={styles.section}>
					<View accessibilityRole='header'>
						<Typography size='H2'>
							Always free. No advertising.
						</Typography>
					</View>
					<Typography weight='Regular'>
						77Faithful is permanently free and does not use
						advertising. Your progress is a personal record, not a
						measure of your faith or God's favor.
					</Typography>
				</View>
			</View>
		</TurndownScrollScreen>
	);
};
