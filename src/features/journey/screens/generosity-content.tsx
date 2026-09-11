import { Card } from '@td/components/ui/card/card.component';
import { Divider } from '@td/components/ui/divider/divider.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { TextColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import type { ReactNode } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { chosenPracticeContent } from './chosen-practice-content';
import {
	GenerosityCopy,
	GenerosityDecoration,
	GenerosityExamples,
	GenerosityHeading,
	GenerosityIconCircle,
	GenerosityNotice,
	GenerosityRow,
	GenerositySections,
	generosityBodyStyle,
	generosityExampleStyle,
	generositySectionStyle,
	generosityTitleStyle,
} from './generosity.styles';

export const GenerosityContent = ({ children }: { children: ReactNode }) => {
	const guidance = chosenPracticeContent.Generosity;
	return (
		<GenerositySections>
			<GenerosityHeading>
				<GenerosityHeading accessibilityRole='header'>
					<Typography style={generosityTitleStyle}>
						Generosity
					</Typography>
				</GenerosityHeading>
				<Typography style={generosityBodyStyle}>
					{guidance.purpose}
				</Typography>
			</GenerosityHeading>
			<Card padding={Spacing.Small}>
				<GenerosityRow>
					<GenerosityIconCircle
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
							<Path d='M16 28 5 17C-3 9 9-1 16 9 23-1 35 9 27 17Z' />
						</Svg>
					</GenerosityIconCircle>
					<GenerosityCopy>
						<Typography style={generosityBodyStyle}>
							{guidance.invitation}
						</Typography>
					</GenerosityCopy>
				</GenerosityRow>
			</Card>
			<Card padding={Spacing.Small}>
				<GenerosityHeading accessibilityRole='header'>
					<Typography style={generositySectionStyle}>
						Ways to practice
					</Typography>
				</GenerosityHeading>
				<Divider />
				<GenerosityExamples>
					{guidance.examples.map((example, index) => (
						<GenerosityRow key={example}>
							<GenerosityIconCircle
								accessibilityElementsHidden
								importantForAccessibility='no-hide-descendants'
							>
								{index < 2 ? (
									<AppIcon
										name={
											index === 0 ? 'Users' : 'Utensils'
										}
										size={IconSizes.Large}
										tone='Brand'
									/>
								) : (
									<Svg
										width={IconSizes.Large}
										height={IconSizes.Large}
										viewBox='0 0 24 24'
										fill='none'
										stroke={TextColors.Brand}
										strokeWidth={1.8}
										strokeLinecap='round'
										strokeLinejoin='round'
									>
										<Path d='M3 8h18v4H3ZM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3Zm0 0h4a3 3 0 1 0-3-3Z' />
									</Svg>
								)}
							</GenerosityIconCircle>
							<GenerosityCopy>
								<Typography style={generosityExampleStyle}>
									{example}
								</Typography>
							</GenerosityCopy>
						</GenerosityRow>
					))}
				</GenerosityExamples>
			</Card>
			<GenerosityNotice>
				<GenerosityDecoration
					accessibilityElementsHidden
					importantForAccessibility='no-hide-descendants'
				>
					<Svg
						width={IconSizes.Medium}
						height={IconSizes.Medium}
						viewBox='0 0 24 24'
						fill='none'
						stroke={TextColors.Primary}
						strokeWidth={1.8}
						strokeLinecap='round'
					>
						<Circle
							cx={12}
							cy={12}
							r={10}
						/>
						<Path d='M12 11v6M12 7v.5' />
					</Svg>
				</GenerosityDecoration>
				<GenerosityCopy>
					<Typography style={generosityExampleStyle}>
						Money is not required, and 77Faithful does not require
						or track an amount. Do not give in a way that puts
						essential needs or responsibilities at risk. You do not
						need to record what you gave or provide proof. Giving to
						77Faithful is never expected.
					</Typography>
				</GenerosityCopy>
			</GenerosityNotice>
			{children}
		</GenerositySections>
	);
};
