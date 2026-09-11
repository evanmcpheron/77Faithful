import { Image } from 'expo-image';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { TurndownStaticScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Surface } from '@td/components/ui/surface/surface.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { SurfaceColors, TextColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';

import { styles } from './support.styles';

const CONTRIBUTION_URL = 'https://wwww.77faithful.com';

export const SupportScreen = () => {
	const insets = useSafeAreaInsets();
	const [isOpening, setIsOpening] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const openContributionPage = async () => {
		if (isOpening) return;
		setIsOpening(true);
		setError(null);
		try {
			await Linking.openURL(CONTRIBUTION_URL);
		} catch {
			setError(
				'We could not open the contribution page. Please try again.',
			);
		} finally {
			setIsOpening(false);
		}
	};

	return (
		<TurndownStaticScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			contentPadding={0}
			bottomSpacing={0}
			safeAreaEdges={[]}
			keyboardEnabled={false}
			testID='support-screen'
		>
			<View style={styles.viewport}>
				<View
					style={[
						styles.hero,
						{ minHeight: insets.top + Spacing.Huge },
					]}
				>
					<Image
						source={require('@td/assets/images/support/olive-landscape.png')}
						style={styles.image}
						contentFit='cover'
						accessible={false}
					/>
					<View
						style={styles.photoOverlay}
						pointerEvents='none'
						accessible={false}
					/>
					<Svg
						style={styles.wave}
						viewBox='0 0 400 32'
						preserveAspectRatio='none'
						accessible={false}
					>
						<Path
							d='M0 9 C100 -2 215 8 300 20 C345 27 375 30 400 23 L400 32 L0 32 Z'
							fill={SurfaceColors.Screen}
						/>
					</Svg>
				</View>
				<View style={styles.body}>
					<View style={styles.intro}>
						<Typography
							tone='Secondary'
							weight='Semibold'
							style={styles.eyebrow}
						>
							SUPPORT 77FAITHFUL
						</Typography>
						<View accessibilityRole='header'>
							<Typography style={styles.title}>
								A place to grow in faith, freely available to
								everyone.
							</Typography>
						</View>
						<Typography
							tone='Secondary'
							style={styles.copy}
						>
							77Faithful was created to help people draw near to
							God through Scripture, prayer, reflection, and
							faithful action.
						</Typography>
					</View>
					<Surface
						variant='Muted'
						padding='Medium'
					>
						<View style={styles.cardRow}>
							<View
								style={styles.botanical}
								accessible={false}
							>
								<Svg
									width={30}
									height={30}
									viewBox='0 0 32 32'
									accessible={false}
								>
									<Path
										d='M16 29 C15 20 18 14 24 8 M16 23 C12 17 8 14 5 10'
										fill='none'
										stroke={TextColors.Brand}
										strokeWidth={1.5}
									/>
									<Path
										d='M18 18 C15 8 23 3 30 3 C30 11 26 17 18 18 Z M13 21 C4 21 2 15 2 8 C10 8 15 12 13 21 Z'
										fill={TextColors.Brand}
									/>
								</Svg>
							</View>
							<View style={styles.cardCopy}>
								<View accessibilityRole='header'>
									<Typography style={styles.cardTitle}>
										Why support it?
									</Typography>
								</View>
								<Typography
									tone='Secondary'
									style={styles.copy}
								>
									Optional contributions help cover hosting
									and server costs. Always free. No ads or
									paid features.
								</Typography>
							</View>
						</View>
					</Surface>
					<View style={styles.welcome}>
						<AppIcon
							name={IconName.UsersFilled}
							size={24}
							tone='Neutral'
						/>
						<View style={styles.welcomeCopy}>
							<Typography
								tone='Secondary'
								style={styles.copy}
							>
								Whether you give or not, you are welcome here.
							</Typography>
						</View>
					</View>
					<View style={styles.action}>
						<TurndownButton
							variant='Solid'
							size='Large'
							trailingIconName={IconName.ArrowRight}
							loading={isOpening}
							onPress={() => void openContributionPage()}
						>
							Support 77Faithful
						</TurndownButton>
						<Typography
							tone='Secondary'
							align='center'
							style={styles.browserHint}
						>
							Opens 77Faithful in your browser.
						</Typography>
						{error && (
							<View accessibilityLiveRegion='polite'>
								<Typography tone='Error'>{error}</Typography>
							</View>
						)}
					</View>
				</View>
				<View
					style={[
						styles.footer,
						{ minHeight: Spacing.XLarge + insets.bottom },
					]}
					pointerEvents='none'
					accessible={false}
					accessibilityElementsHidden
					importantForAccessibility='no-hide-descendants'
				>
					<Image
						source={require('@td/assets/images/support/watercolor-footer-supplied.png')}
						style={styles.footerImage}
						contentFit='cover'
						contentPosition='top'
						accessible={false}
					/>
				</View>
			</View>
		</TurndownStaticScreen>
	);
};
