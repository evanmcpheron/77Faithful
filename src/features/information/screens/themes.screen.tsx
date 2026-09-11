import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Surface } from '@td/components/ui/surface/surface.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { SurfaceColors } from '@td/theme/colors';
import { WeeklyThemeColors } from '@td/theme/weekly-theme-colors';
import type { TFormationThemeId } from '@td/types/formation/formation-course.types';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { WEEKLY_THEMES } from '../weekly-themes';
import { ThemeOverviewModal } from './theme-overview-modal';
import {
	StyledHeroCopy,
	StyledHeroGradient,
	StyledHeroImage,
	StyledThemeCopy,
	StyledThemeList,
	StyledThemeRow,
	StyledThemesContent,
	StyledThemesHero,
	StyledWeekBadge,
	textStyles,
} from './themes.styles';

export const ThemesScreen = () => {
	const [selectedThemeId, setSelectedThemeId] =
		useState<TFormationThemeId | null>(null);
	return (
		<>
			<TurndownScrollScreen
				backgroundColor={SurfaceColors.Screen}
				contentBackgroundColor={SurfaceColors.Screen}
				contentPadding={0}
				safeAreaEdges={['bottom', 'left', 'right']}
				keyboardEnabled={false}
				testID='themes-screen'
			>
				<StyledThemesContent>
					<StyledThemesHero>
						<StyledHeroImage
							source={require('@td/assets/images/themes/forest-sunrise.png')}
							contentFit='cover'
							accessible={false}
						/>
						<StyledHeroGradient
							colors={[
								WeeklyThemeColors.Transparent,
								WeeklyThemeColors.HeroScrim,
							]}
							locations={[0.25, 1]}
							pointerEvents='none'
						/>
						<StyledHeroCopy>
							<View accessibilityRole='header'>
								<Typography style={textStyles.heroTitle}>
									{'A 77-day journey\nwith a greater purpose'}
								</Typography>
							</View>
							<Typography style={textStyles.heroDescription}>
								Each week explores a new theme to help you grow
								in your relationship with God. Tap a week to see
								the focus and related practices.
							</Typography>
						</StyledHeroCopy>
					</StyledThemesHero>
					<StyledThemeList>
						{WEEKLY_THEMES.map((theme, index) => (
							<Pressable
								key={theme.themeId}
								accessibilityRole='button'
								accessibilityLabel={`Week ${index + 1}, ${theme.title}. ${theme.description}`}
								accessibilityHint='Opens a modal'
								onPress={() =>
									setSelectedThemeId(theme.themeId)
								}
								testID={`theme-${theme.themeId}`}
							>
								<Surface padding='None'>
									<StyledThemeRow>
										<StyledWeekBadge
											style={{
												backgroundColor: theme.color,
											}}
										>
											<Typography
												style={textStyles.weekNumber}
											>
												{index + 1}
											</Typography>
										</StyledWeekBadge>
										<StyledThemeCopy>
											<Typography
												style={textStyles.themeTitle}
											>
												{theme.title}
											</Typography>
											<Typography
												tone='Secondary'
												style={
													textStyles.themeDescription
												}
											>
												{theme.description}
											</Typography>
										</StyledThemeCopy>
										<AppIcon
											name={IconName.Arrow}
											size={18}
											style={{
												transform: [
													{ rotate: '90deg' },
												],
											}}
											tone='Neutral'
										/>
									</StyledThemeRow>
								</Surface>
							</Pressable>
						))}
					</StyledThemeList>
				</StyledThemesContent>
			</TurndownScrollScreen>
			<ThemeOverviewModal
				themeId={selectedThemeId}
				onClose={() => setSelectedThemeId(null)}
			/>
		</>
	);
};
