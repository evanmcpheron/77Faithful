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
	DisciplineAction,
	DisciplineCopy,
	DisciplineDecoration,
	DisciplineExamples,
	DisciplineHeading,
	DisciplineIconCircle,
	DisciplineRow,
	DisciplineSections,
	disciplineNoticeStyle,
	disciplineSectionStyle,
	disciplineTitleStyle,
} from './intentional-discipline.styles';

const illustrationPaths = {
	phone: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM12 19h.01',
	play: 'M5 5a2 2 0 0 1 3-1.7l12 7a2 2 0 0 1 0 3.4l-12 7A2 2 0 0 1 5 19Z',
	shield: 'M12 2c3 2 5 3 8 3v7c0 5-5 8-8 10-3-2-8-5-8-10V5c3 0 5-1 8-3Z',
};

const DisciplineIllustration = ({
	kind,
}: {
	kind: keyof typeof illustrationPaths;
}) => (
	<DisciplineDecoration
		accessibilityElementsHidden
		importantForAccessibility='no-hide-descendants'
	>
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
			<Path d={illustrationPaths[kind]} />
		</Svg>
	</DisciplineDecoration>
);

export const IntentionalDisciplineContent = ({
	children,
}: {
	children: ReactNode;
}) => {
	const guidance = chosenPracticeContent.IntentionalDiscipline;
	return (
		<DisciplineSections>
			<DisciplineHeading>
				<DisciplineHeading accessibilityRole='header'>
					<Typography
						weight='Bold'
						style={disciplineTitleStyle}
					>
						Intentional Discipline
					</Typography>
				</DisciplineHeading>
				<Typography
					size='H2'
					tone='Secondary'
				>
					{guidance.purpose}
				</Typography>
			</DisciplineHeading>
			<Divider />
			<DisciplineHeading>
				<DisciplineHeading accessibilityRole='header'>
					<Typography
						tone='Brand'
						weight='Semibold'
						style={disciplineSectionStyle}
					>
						How to begin
					</Typography>
				</DisciplineHeading>
				<Typography size='H2'>{guidance.invitation}</Typography>
			</DisciplineHeading>
			<DisciplineHeading>
				<DisciplineHeading accessibilityRole='header'>
					<Typography
						tone='Brand'
						weight='Semibold'
						style={disciplineSectionStyle}
					>
						Ways to practice
					</Typography>
				</DisciplineHeading>
				<DisciplineExamples>
					{guidance.examples.map((example, index) => (
						<DisciplineRow key={example}>
							<DisciplineIconCircle>
								<DisciplineIllustration
									kind={index === 0 ? 'phone' : 'play'}
								/>
							</DisciplineIconCircle>
							<DisciplineCopy>
								<Typography size='H2'>{example}</Typography>
							</DisciplineCopy>
						</DisciplineRow>
					))}
				</DisciplineExamples>
			</DisciplineHeading>
			<Card
				variant='Muted'
				padding={Spacing.Medium}
			>
				<DisciplineRow style={disciplineNoticeStyle}>
					<DisciplineIllustration kind='shield' />
					<DisciplineCopy>
						<DisciplineHeading accessibilityRole='header'>
							<Typography
								size='H2'
								weight='Semibold'
							>
								Keep the practice safe
							</Typography>
						</DisciplineHeading>
						<Typography>
							Keep the restraint voluntary, safe, and appropriate
							for your circumstances. Food fasting is not
							required. Do not restrict necessary food, water,
							medicine, or care. There is no required duration or
							level of difficulty, and completing this practice
							does not earn God’s favor.
						</Typography>
					</DisciplineCopy>
				</DisciplineRow>
			</Card>
			<DisciplineAction>{children}</DisciplineAction>
		</DisciplineSections>
	);
};
