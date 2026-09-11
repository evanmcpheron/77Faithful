import { Card } from '@td/components/ui/card/card.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import type { ReactNode } from 'react';
import Svg, { Path } from 'react-native-svg';
import { chosenPracticeContent } from './chosen-practice-content';
import {
	GratitudeAction,
	GratitudeCopy,
	GratitudeExamples,
	GratitudeHeading,
	GratitudeIconCircle,
	GratitudeRow,
	GratitudeSections,
	gratitudeBodyStyle,
	gratitudeIconColors,
	gratitudeIconStyles,
	gratitudeSectionStyle,
	gratitudeTitleStyle,
} from './gratitude.styles';

export const GratitudeContent = ({ children }: { children: ReactNode }) => {
	const guidance = chosenPracticeContent.Gratitude;
	return (
		<GratitudeSections>
			<GratitudeHeading>
				<GratitudeHeading accessibilityRole='header'>
					<Typography
						align='center'
						weight='Regular'
						style={gratitudeTitleStyle}
					>
						Gratitude
					</Typography>
				</GratitudeHeading>
				<Typography
					align='center'
					tone='Secondary'
					style={gratitudeBodyStyle}
				>
					{guidance.purpose}
				</Typography>
			</GratitudeHeading>
			<Card
				variant='Outlined'
				padding={Spacing.Small}
			>
				<GratitudeHeading accessibilityRole='header'>
					<Typography
						tone='Brand'
						style={gratitudeSectionStyle}
					>
						Begin here
					</Typography>
				</GratitudeHeading>
				<Typography style={gratitudeBodyStyle}>
					{guidance.invitation}
				</Typography>
			</Card>
			<GratitudeExamples>
				<GratitudeHeading accessibilityRole='header'>
					<Typography style={gratitudeSectionStyle}>
						Ways to practice
					</Typography>
				</GratitudeHeading>
				{guidance.examples.map((example, index) => (
					<GratitudeRow key={example}>
						<GratitudeIconCircle
							style={gratitudeIconStyles[index]}
							accessibilityElementsHidden
							importantForAccessibility='no-hide-descendants'
						>
							{index === 0 ? (
								<AppIcon
									name='Users'
									variant='Solid'
									size={IconSizes.XLarge}
									tone='Brand'
								/>
							) : (
								<Svg
									width={IconSizes.XLarge}
									height={IconSizes.XLarge}
									viewBox='0 0 32 32'
									fill='none'
									stroke={
										gratitudeIconColors[index === 1 ? 1 : 2]
									}
									strokeWidth={2}
									strokeLinecap='round'
									strokeLinejoin='round'
								>
									<Path
										d={
											index === 1
												? 'M4 14h24V9H4v5Zm2 0v15h20V14M16 9v20M16 9H11a4 4 0 1 1 4-4l1 4Zm0 0h5a4 4 0 1 0-4-4l-1 4Z'
												: 'M16 8C12 5 7 5 2 7v21c5-2 10-2 14 1 4-3 9-3 14-1V7c-5-2-10-2-14 1Zm0 0v21'
										}
									/>
								</Svg>
							)}
						</GratitudeIconCircle>
						<GratitudeCopy>
							<Typography style={gratitudeBodyStyle}>
								{example}
							</Typography>
						</GratitudeCopy>
					</GratitudeRow>
				))}
			</GratitudeExamples>
			<GratitudeAction>{children}</GratitudeAction>
		</GratitudeSections>
	);
};
