import { Card } from '@td/components/ui/card/card.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { TextColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import type { ReactNode } from 'react';
import Svg, { Path } from 'react-native-svg';
import { chosenPracticeContent } from './chosen-practice-content';
import {
	MemorizationAction,
	MemorizationCopy,
	MemorizationHeading,
	MemorizationIconCircle,
	MemorizationRow,
	MemorizationSections,
	memorizationBodyStyle,
	memorizationSectionStyle,
	memorizationTitleStyle,
} from './memorization.styles';

const illustrationPaths = {
	compass: 'm25 7-6 12-12 6 6-12 12-6ZM13 13l6 6',
	book: 'M16 8C12 5 7 5 2 7v21c5-2 10-2 14 1 4-3 9-3 14-1V7c-5-2-10-2-14 1Zm0 0v21',
	review: 'M27 12A12 12 0 0 0 6 7l-3 5m0-7v7h7M5 20a12 12 0 0 0 21 5l3-5m0 7v-7h-7',
	seedling:
		'M16 28V16M16 21C5 22 3 15 3 9c9-1 14 3 13 12Zm0-3C16 8 23 5 29 6c0 9-4 15-13 12ZM8 13l8 8M23 11l-7 7',
};
const exampleIllustrations = ['book', 'review', 'seedling'] as const;

const MemorizationIllustration = ({
	kind,
}: {
	kind: keyof typeof illustrationPaths;
}) => (
	<MemorizationIconCircle
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
			<Path d={illustrationPaths[kind]} />
		</Svg>
	</MemorizationIconCircle>
);

export const MemorizationContent = ({ children }: { children: ReactNode }) => {
	const guidance = chosenPracticeContent.ScriptureMemorization;
	return (
		<MemorizationSections>
			<MemorizationHeading>
				<MemorizationHeading accessibilityRole='header'>
					<Typography
						weight='Regular'
						style={memorizationTitleStyle}
					>
						Scripture Memorization
					</Typography>
				</MemorizationHeading>
				<Typography>{guidance.purpose}</Typography>
			</MemorizationHeading>
			<Card
				variant='Muted'
				padding={Spacing.Medium}
			>
				<MemorizationRow>
					<MemorizationIllustration kind='compass' />
					<MemorizationCopy accessibilityRole='header'>
						<Typography style={memorizationSectionStyle}>
							How to begin
						</Typography>
					</MemorizationCopy>
				</MemorizationRow>
				<Typography style={memorizationBodyStyle}>
					{guidance.invitation}
				</Typography>
			</Card>
			<Card
				variant='Outlined'
				padding={Spacing.Medium}
			>
				<MemorizationHeading accessibilityRole='header'>
					<Typography style={memorizationSectionStyle}>
						Ways to practice
					</Typography>
				</MemorizationHeading>
				{guidance.examples.map((example, index) => (
					<MemorizationRow key={example}>
						<MemorizationIllustration
							kind={exampleIllustrations[index] ?? 'book'}
						/>
						<MemorizationCopy>
							<Typography style={memorizationBodyStyle}>
								{example}
							</Typography>
						</MemorizationCopy>
					</MemorizationRow>
				))}
			</Card>
			<Card
				variant='Muted'
				padding={Spacing.Small}
			>
				<MemorizationRow>
					<AppIcon
						name='Lightbulb'
						tone='Neutral'
						size={IconSizes.Large}
					/>
					<MemorizationCopy>
						<Typography
							tone='Secondary'
							style={memorizationBodyStyle}
						>
							There is no required number of verses and no
							perfect-recall test. Mark complete after you have
							intentionally spent time memorizing or reviewing
							Scripture.
						</Typography>
					</MemorizationCopy>
				</MemorizationRow>
			</Card>
			<MemorizationAction>{children}</MemorizationAction>
		</MemorizationSections>
	);
};
