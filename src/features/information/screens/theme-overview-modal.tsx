import { Modal } from '@td/components/layout/modal/modal.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Divider } from '@td/components/ui/divider/divider.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { Spacing } from '@td/theme/spacing';
import {
	FormationStructure,
	type TFormationThemeId,
} from '@td/types/formation/formation-course.types';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WEEKLY_THEME_OVERVIEWS } from '../weekly-theme-overviews';
import { WEEKLY_THEMES } from '../weekly-themes';
import {
	StyledOverviewBody,
	StyledOverviewFooter,
	StyledOverviewHandle,
	StyledOverviewRule,
	StyledOverviewSection,
	overviewTextStyles,
} from './theme-overview-modal.styles';

interface IThemeOverviewModalProps {
	themeId: TFormationThemeId | null;
	onClose: () => void;
}

export const ThemeOverviewModal = ({
	themeId,
	onClose,
}: IThemeOverviewModalProps) => {
	const { height } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const weekIndex = WEEKLY_THEMES.findIndex(
		(theme) => theme.themeId === themeId,
	);
	const theme = WEEKLY_THEMES[weekIndex];
	if (!theme) return null;
	const overview = WEEKLY_THEME_OVERVIEWS[theme.themeId];
	const firstDay = weekIndex * FormationStructure.DaysPerWeek + 1;
	const lastDay = (weekIndex + 1) * FormationStructure.DaysPerWeek;

	return (
		<Modal
			open
			title=''
			onClose={onClose}
		>
			<ScrollView
				style={{
					maxHeight: Math.max(
						Spacing.Huge,
						height -
							insets.top -
							insets.bottom -
							Spacing.XXHuge -
							Spacing.Large,
					),
				}}
				contentInsetAdjustmentBehavior='never'
			>
				<StyledOverviewBody
					accessibilityViewIsModal
					onAccessibilityEscape={onClose}
				>
					<StyledOverviewHandle accessible={false} />
					<Typography
						style={overviewTextStyles.label}
						weight='Semibold'
					>
						WEEK {weekIndex + 1}
					</Typography>
					<StyledOverviewSection>
						<View accessibilityRole='header'>
							<Typography style={overviewTextStyles.title}>
								{theme.title}
							</Typography>
						</View>
						<StyledOverviewRule accessible={false} />
						<Typography style={overviewTextStyles.body}>
							{overview.focus}
						</Typography>
					</StyledOverviewSection>
					<StyledOverviewSection>
						<View accessibilityRole='header'>
							<Typography
								style={overviewTextStyles.label}
								weight='Semibold'
							>
								ABOUT THIS WEEK
							</Typography>
						</View>
						<Typography style={overviewTextStyles.body}>
							{overview.about}
						</Typography>
					</StyledOverviewSection>
					<StyledOverviewSection>
						<View accessibilityRole='header'>
							<Typography
								style={overviewTextStyles.label}
								weight='Semibold'
							>
								THIS WEEK
							</Typography>
						</View>
						<Typography style={overviewTextStyles.body}>
							Day {firstDay} — {lastDay}
						</Typography>
					</StyledOverviewSection>
				</StyledOverviewBody>
			</ScrollView>
			<StyledOverviewFooter>
				<Divider />
				<TurndownButton
					variant='Ghost'
					size='Large'
					fullWidth
					onPress={onClose}
				>
					Close
				</TurndownButton>
			</StyledOverviewFooter>
		</Modal>
	);
};
