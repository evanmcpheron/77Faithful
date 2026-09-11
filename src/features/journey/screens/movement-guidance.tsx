import { Card } from '@td/components/ui/card/card.component';
import { Divider } from '@td/components/ui/divider/divider.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { TextColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import Svg, { Circle, Path } from 'react-native-svg';
import {
	MovementCopy,
	MovementExamplesSection,
	MovementIllustrationCircle,
	MovementIntroduction,
	MovementRow,
	movementBodyStyle,
	movementSectionTitleStyle,
} from './movement.styles';

// Decorative line illustrations for the four movement invitations.
const MovementIllustration = ({
	kind,
}: {
	kind: 'seedling' | 'walk' | 'stretch' | 'heart';
}) => (
	<MovementIllustrationCircle
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
			{kind === 'seedling' && (
				<Path d='M16 28V16M16 21C5 22 3 15 3 9c9-1 14 3 13 12Zm0-3C16 8 23 5 29 6c0 9-4 15-13 12ZM8 13l8 8M23 11l-7 7' />
			)}
			{kind === 'walk' && (
				<>
					<Circle
						cx={18}
						cy={5}
						r={3}
					/>
					<Path d='m12 29 4-10 3 4 5 6M9 17l4-7 5 1 3 6 5 2M18 11l-3 8-5 5-3 5' />
				</>
			)}
			{kind === 'stretch' && (
				<>
					<Circle
						cx={16}
						cy={6}
						r={3}
					/>
					<Path d='m13 11-4 7v8h17v-3H14v-5l5 3 5 1M15 11l4 5 6-6M6 28h22M9 17l-4 6v5' />
				</>
			)}
			{kind === 'heart' && (
				<Path d='M16 28 4 16C-3 7 8-1 16 8 24-1 35 7 28 16Z' />
			)}
		</Svg>
	</MovementIllustrationCircle>
);

export const MovementGuidance = ({ invitation }: { invitation: string }) => (
	<Card
		variant='Muted'
		padding={Spacing.Small}
	>
		<MovementIntroduction>
			<MovementIllustration kind='seedling' />
			<MovementCopy>
				<Typography
					weight='Semibold'
					style={movementSectionTitleStyle}
				>
					Begin here
				</Typography>
				<Typography
					weight='Regular'
					style={movementBodyStyle}
				>
					{invitation}
				</Typography>
			</MovementCopy>
		</MovementIntroduction>
	</Card>
);

const exampleIllustrations = ['walk', 'stretch', 'heart'] as const;
export const MovementExamples = ({
	examples,
}: {
	examples: readonly string[];
}) => (
	<MovementExamplesSection>
		<Divider />
		<Typography
			weight='Semibold'
			style={movementSectionTitleStyle}
		>
			Ways to practice
		</Typography>
		{examples.map((example, index) => (
			<MovementRow key={example}>
				<MovementIllustration
					kind={exampleIllustrations[index] ?? 'heart'}
				/>
				<MovementCopy>
					<Typography
						weight='Regular'
						style={movementBodyStyle}
					>
						{example}
					</Typography>
				</MovementCopy>
			</MovementRow>
		))}
	</MovementExamplesSection>
);
