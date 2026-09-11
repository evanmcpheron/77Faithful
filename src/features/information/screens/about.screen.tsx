import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';

import { styles } from './information.styles';

export const AboutScreen = () => {
	const router = useRouter();
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			contentPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			keyboardEnabled={false}
		>
			<View style={styles.content}>
				<View style={styles.section}>
					<View accessibilityRole='header'>
						<Typography size='H1'>Centered on Christ</Typography>
					</View>
					<Typography weight='Regular'>
						77Faithful is a 77-day journey of reading Scripture,
						prayer, and reflection, with Jesus Christ at the center.
					</Typography>
					<Typography weight='Regular'>
						These practices do not earn God’s favor. Missing a day
						never resets your journey.
					</Typography>
				</View>
				<View style={styles.section}>
					<View accessibilityRole='header'>
						<Typography size='H2'>Always free. No ads.</Typography>
					</View>
					<Typography
						weight='Regular'
						tone='Secondary'
					>
						Optional contributions help cover running costs.
					</Typography>
					<TurndownButton
						variant='Link'
						onPress={() => router.push('/support')}
					>
						Support 77Faithful
					</TurndownButton>
				</View>
			</View>
		</TurndownScrollScreen>
	);
};
