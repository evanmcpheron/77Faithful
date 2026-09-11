import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { TextColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import type { ReactNode } from 'react';
import Svg, { Path } from 'react-native-svg';
import { chosenPracticeContent } from './chosen-practice-content';
import {
	WitnessAction,
	WitnessBullet,
	WitnessCopy,
	WitnessDecoration,
	WitnessExamples,
	WitnessHeading,
	WitnessInvitation,
	WitnessRow,
	WitnessSections,
	witnessBodyStyle,
	witnessIntroductionStyle,
	witnessNoticeStyle,
	witnessSectionStyle,
	witnessTitleStyle,
} from './intentional-witness.styles';

const WitnessIllustration = ({ kind }: { kind: 'sprout' | 'shield' }) => (
	<WitnessDecoration
		accessibilityElementsHidden
		importantForAccessibility='no-hide-descendants'
	>
		<Svg
			width={IconSizes.Large}
			height={IconSizes.Large}
			viewBox='0 0 32 32'
			fill='none'
			stroke={TextColors.Brand}
			strokeWidth={2}
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<Path
				d={
					kind === 'sprout'
						? 'M16 29V18M16 23C6 23 3 16 3 9c9 0 13 5 13 14ZM16 18C16 7 22 3 30 2c0 10-5 16-14 16ZM16 23 7 13M16 18 25 7'
						: 'M16 3c4 3 7 4 11 4v9c0 6-6 11-11 14C11 27 5 22 5 16V7c4 0 7-1 11-4Z'
				}
			/>
		</Svg>
	</WitnessDecoration>
);

export const IntentionalWitnessContent = ({
	children,
}: {
	children: ReactNode;
}) => {
	const guidance = chosenPracticeContent.IntentionalWitness;
	return (
		<WitnessSections>
			<WitnessHeading>
				<WitnessHeading accessibilityRole='header'>
					<Typography
						align='center'
						weight='Regular'
						style={witnessTitleStyle}
					>
						Intentional Witness
					</Typography>
				</WitnessHeading>
				<Typography
					align='center'
					style={witnessIntroductionStyle}
				>
					{guidance.purpose}
				</Typography>
			</WitnessHeading>
			<Card
				variant='Muted'
				padding={Spacing.Medium}
			>
				<WitnessInvitation>
					<WitnessIllustration kind='sprout' />
					<Typography style={witnessIntroductionStyle}>
						{guidance.invitation}
					</Typography>
				</WitnessInvitation>
			</Card>
			<WitnessExamples>
				<WitnessHeading accessibilityRole='header'>
					<Typography style={witnessSectionStyle}>
						Ways to practice
					</Typography>
				</WitnessHeading>
				{guidance.examples.map((example) => (
					<WitnessRow key={example}>
						<WitnessBullet
							accessibilityElementsHidden
							importantForAccessibility='no-hide-descendants'
						/>
						<WitnessCopy>
							<Typography style={witnessBodyStyle}>
								{example}
							</Typography>
						</WitnessCopy>
					</WitnessRow>
				))}
			</WitnessExamples>
			<Card
				variant='Muted'
				padding={Spacing.Small}
			>
				<WitnessRow>
					<WitnessIllustration kind='shield' />
					<WitnessCopy>
						<Typography style={witnessNoticeStyle}>
							Do not pressure someone into a religious
							conversation or use a confrontational script. A
							particular response from the other person is not
							required for completion.
						</Typography>
					</WitnessCopy>
				</WitnessRow>
			</Card>
			<WitnessAction>{children}</WitnessAction>
		</WitnessSections>
	);
};
