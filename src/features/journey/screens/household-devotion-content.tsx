import { Typography } from '@td/components/ui/typography/typography.component';
import { Spacing } from '@td/theme/spacing';
import { useHeaderHeight } from 'expo-router/react-navigation';
import type { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chosenPracticeContent } from './chosen-practice-content';
import {
	HouseholdAction,
	HouseholdCopy,
	HouseholdExamples,
	HouseholdIntroduction,
	HouseholdNumber,
	HouseholdRow,
	HouseholdRows,
	HouseholdSections,
	householdSectionStyle,
	householdTitleStyle,
} from './household-devotion.styles';
import { PassageSection } from './scripture.styles';

export const HouseholdDevotionContent = ({
	children,
}: {
	children: ReactNode;
}) => {
	const guidance = chosenPracticeContent.FamilyOrHouseholdDevotion;
	const { height } = useWindowDimensions();
	const headerHeight = useHeaderHeight();
	const insets = useSafeAreaInsets();
	return (
		<HouseholdSections
			style={{
				minHeight: Math.max(
					0,
					height - headerHeight - insets.bottom - Spacing.Large,
				),
			}}
		>
			<HouseholdIntroduction>
				<PassageSection
					accessible
					accessibilityRole='header'
				>
					<Typography style={householdTitleStyle}>
						{'Family or\nHousehold Devotion'}
					</Typography>
				</PassageSection>
				<Typography>{guidance.purpose}</Typography>
			</HouseholdIntroduction>
			<HouseholdExamples>
				<PassageSection
					accessible
					accessibilityRole='header'
				>
					<Typography style={householdSectionStyle}>
						Ways to practice
					</Typography>
				</PassageSection>
				<HouseholdRows>
					{guidance.examples.map((example, index) => (
						<HouseholdRow key={example}>
							<HouseholdNumber>
								<Typography
									tone='Brand'
									style={householdSectionStyle}
								>
									{index + 1}
								</Typography>
							</HouseholdNumber>
							<HouseholdCopy>
								<Typography>{example}</Typography>
							</HouseholdCopy>
						</HouseholdRow>
					))}
				</HouseholdRows>
			</HouseholdExamples>
			<HouseholdAction>{children}</HouseholdAction>
		</HouseholdSections>
	);
};
