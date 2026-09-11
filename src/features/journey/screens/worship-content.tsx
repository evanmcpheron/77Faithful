import { Card } from '@td/components/ui/card/card.component';
import { Divider } from '@td/components/ui/divider/divider.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { TextColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import type { ReactNode } from 'react';
import Svg, { Path } from 'react-native-svg';
import { chosenPracticeContent } from './chosen-practice-content';
import {
	WorshipAction,
	WorshipCopy,
	WorshipExamples,
	WorshipHeading,
	WorshipIconCircle,
	WorshipIntroduction,
	WorshipRow,
	WorshipRows,
	WorshipSections,
	worshipBodyStyle,
	worshipExampleStyle,
	worshipIconStyles,
	worshipSectionStyle,
	worshipTitleStyle,
} from './worship.styles';

const worshipIconPaths = [
	'M12 24V7l14-3v17M12 11l14-3M12 24c0 4-8 5-8 1s8-5 8-1Zm14-3c0 4-8 5-8 1s8-5 8-1Z',
	'M16 8C12 4 7 4 3 6v21c4-2 9-2 13 1 4-3 9-3 13-1V6c-4-2-9-2-13 2Zm0 0v20',
	'M14 3c-2 0-3 7-4 11l-2 8-5 5 6 3 7-7V5c0-2-1-3-2-2Zm4 0c2 0 3 7 4 11l2 8 5 5-6 3-7-7M11 15l2-8M21 15l-2-8',
];

export const WorshipContent = ({ children }: { children: ReactNode }) => {
	const guidance = chosenPracticeContent.Worship;
	return (
		<WorshipSections>
			<WorshipIntroduction>
				<WorshipHeading accessibilityRole='header'>
					<Typography
						align='center'
						style={worshipTitleStyle}
					>
						Worship
					</Typography>
				</WorshipHeading>
				<Typography
					align='center'
					style={worshipBodyStyle}
				>
					{guidance.purpose}
				</Typography>
			</WorshipIntroduction>
			<Card
				variant='Muted'
				padding={Spacing.Medium}
			>
				<WorshipHeading accessibilityRole='header'>
					<Typography style={worshipSectionStyle}>
						Begin here
					</Typography>
				</WorshipHeading>
				<Typography style={worshipBodyStyle}>
					{guidance.invitation}
				</Typography>
			</Card>
			<WorshipExamples>
				<Divider />
				<WorshipHeading accessibilityRole='header'>
					<Typography style={worshipSectionStyle}>
						Ways to practice
					</Typography>
				</WorshipHeading>
				<WorshipRows>
					{guidance.examples.map((example, index) => (
						<WorshipRow key={example}>
							<WorshipIconCircle
								style={worshipIconStyles[index]}
								accessibilityElementsHidden
								importantForAccessibility='no-hide-descendants'
							>
								<Svg
									width={IconSizes.XLarge}
									height={IconSizes.XLarge}
									viewBox='0 0 32 32'
									fill='none'
									stroke={TextColors.Brand}
									strokeWidth={2}
									strokeLinecap='round'
									strokeLinejoin='round'
								>
									<Path d={worshipIconPaths[index] ?? ''} />
								</Svg>
							</WorshipIconCircle>
							<WorshipCopy>
								<Typography style={worshipExampleStyle}>
									{example}
								</Typography>
							</WorshipCopy>
						</WorshipRow>
					))}
				</WorshipRows>
			</WorshipExamples>
			<WorshipAction>{children}</WorshipAction>
		</WorshipSections>
	);
};
