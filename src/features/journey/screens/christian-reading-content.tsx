import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { TextColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import { useHeaderHeight } from 'expo-router/react-navigation';
import type { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { chosenPracticeContent } from './chosen-practice-content';
import {
	ChristianReadingAction,
	ChristianReadingCopy,
	ChristianReadingHeading,
	ChristianReadingIcon,
	ChristianReadingRow,
	ChristianReadingSections,
	christianReadingSectionStyle,
	christianReadingTitleStyle,
} from './christian-reading.styles';
import { PassageSection } from './scripture.styles';

export const ChristianReadingContent = ({
	children,
}: {
	children: ReactNode;
}) => {
	const guidance = chosenPracticeContent.ChristianReading;
	const { height } = useWindowDimensions();
	const headerHeight = useHeaderHeight();
	const insets = useSafeAreaInsets();
	const sections = [
		{
			title: 'Ways to practice',
			copy: guidance.invitation,
			path: 'M16 8C12 5 7 5 2 7v21c5-2 10-2 14 1 4-3 9-3 14-1V7c-5-2-10-2-14 1Zm0 0v21',
		},
		{
			title: 'For example',
			copy: guidance.examples[0],
			path: 'M16 28V16M16 21C5 22 3 15 3 9c9-1 14 3 13 12Zm0-3C16 8 23 5 29 6c0 9-4 15-13 12ZM8 13l8 8M23 11l-7 7',
		},
	];
	return (
		<ChristianReadingSections
			style={{
				minHeight: Math.max(
					0,
					height - headerHeight - insets.bottom - Spacing.Small,
				),
			}}
		>
			<ChristianReadingHeading>
				<PassageSection accessibilityRole='header'>
					<Typography
						weight='Regular'
						style={christianReadingTitleStyle}
					>
						Christian Reading
					</Typography>
				</PassageSection>
				<Typography>{guidance.purpose}</Typography>
			</ChristianReadingHeading>
			{sections.map(({ title, copy, path }) => (
				<Card
					key={title}
					variant='Outlined'
					padding={Spacing.Small}
				>
					<ChristianReadingRow>
						<ChristianReadingIcon
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
								<Path d={path} />
							</Svg>
						</ChristianReadingIcon>
						<ChristianReadingCopy>
							<PassageSection accessibilityRole='header'>
								<Typography
									style={christianReadingSectionStyle}
								>
									{title}
								</Typography>
							</PassageSection>
							<Typography>{copy}</Typography>
						</ChristianReadingCopy>
					</ChristianReadingRow>
				</Card>
			))}
			<ChristianReadingAction>{children}</ChristianReadingAction>
		</ChristianReadingSections>
	);
};
