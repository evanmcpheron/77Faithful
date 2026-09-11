import { Card } from '@td/components/ui/card/card.component';
import { Divider } from '@td/components/ui/divider/divider.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { TextColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import type { ReactNode } from 'react';
import Svg, { Path } from 'react-native-svg';
import {
	chosenPracticeContent,
	serveOrEncourageNotes,
} from './chosen-practice-content';
import {
	ServeContent,
	ServeExampleCopy,
	ServeExampleRow,
	ServeExamples,
	ServeHeading,
	ServeHeadingRule,
	ServeIconCircle,
	serveBodyStyle,
	serveExampleStyle,
	serveNoteStyle,
	serveTitleStyle,
} from './serve-or-encourage.styles';

export const ServeOrEncourageContent = ({
	children,
}: {
	children: ReactNode;
}) => {
	const guidance = chosenPracticeContent.ServeOrEncourage;
	return (
		<ServeContent>
			<ServeHeading>
				<ServeHeading accessibilityRole='header'>
					<Typography
						align='center'
						style={serveTitleStyle}
					>
						Serve or Encourage
					</Typography>
				</ServeHeading>
				<Typography
					align='center'
					style={serveBodyStyle}
				>
					{guidance.purpose}
				</Typography>
				<ServeHeadingRule>
					<Divider />
				</ServeHeadingRule>
			</ServeHeading>
			<Card
				variant='Muted'
				padding={Spacing.Small}
			>
				<Typography
					align='center'
					style={serveBodyStyle}
				>
					{guidance.invitation}
				</Typography>
			</Card>
			<ServeExamples>
				<Typography
					weight='Semibold'
					style={serveExampleStyle}
				>
					Ways to practice
				</Typography>
				{guidance.examples.map((example, index) => (
					<ServeExampleRow key={example}>
						<ServeIconCircle
							accessibilityElementsHidden
							importantForAccessibility='no-hide-descendants'
						>
							{index === 1 ? (
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
									<Path d='M7 5h18a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H13l-7 5v-5a3 3 0 0 1-3-3V8a3 3 0 0 1 4-3ZM10 14h1m4 0h1m4 0h1' />
								</Svg>
							) : (
								<AppIcon
									name={index === 0 ? 'MugHot' : 'Users'}
									size={IconSizes.XLarge}
									tone='Brand'
								/>
							)}
						</ServeIconCircle>
						<ServeExampleCopy>
							<Typography style={serveExampleStyle}>
								{example}
							</Typography>
						</ServeExampleCopy>
					</ServeExampleRow>
				))}
			</ServeExamples>
			<Divider />
			<Typography
				tone='Secondary'
				style={serveNoteStyle}
			>
				{serveOrEncourageNotes.boundaries}
			</Typography>
			{children}
		</ServeContent>
	);
};
