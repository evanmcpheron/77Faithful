import { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { Typography } from '@td/components/ui/typography/typography.component';
import { StyledHeaderSvg } from '@td/features/shared/styles/screen.styles';

import {
	MainHeaderLayout,
	StyledHeader,
	StyledHeaderBackground,
	StyledHeaderGradient,
	StyledHeroCard,
	StyledHeroImage,
} from './main-header.styles';
import type { IMainHeaderProps } from './main-header.types';

export const MainHeader = ({
	title,
	hasGradientHeader = false,
	canGoBack = false,
	description,
	scrollOffset,
}: IMainHeaderProps) => {
	const hasHeroContent = Boolean(title || description);

	const headerBackgroundAnimatedStyle = useAnimatedStyle(() => {
		const currentScrollOffset = scrollOffset ? scrollOffset.value : 0;

		return {
			transform: [
				{
					translateY: interpolate(
						currentScrollOffset,
						[
							-MainHeaderLayout.HeaderBackgroundHeight,
							0,
							MainHeaderLayout.HeaderBackgroundHeight,
						],
						[
							-MainHeaderLayout.HeaderBackgroundHeight / 2,
							0,
							MainHeaderLayout.HeaderBackgroundHeight * 0.35,
						],
					),
				},
				{
					scale: interpolate(
						currentScrollOffset,
						[
							-MainHeaderLayout.HeaderBackgroundHeight,
							0,
							MainHeaderLayout.HeaderBackgroundHeight,
						],
						[2, 1, 1],
					),
				},
			],
		};
	});

	return (
		<StyledHeader
			hasGradientHeader={hasGradientHeader}
			canGoBack={canGoBack}
			hasHeroContent={hasHeroContent}
		>
			<StyledHeaderBackground
				style={headerBackgroundAnimatedStyle}
				hasGradientHeader={hasGradientHeader}
				canGoBack={canGoBack}
				hasHeroContent={hasHeroContent}
			>
				{hasGradientHeader ? (
					<StyledHeaderGradient />
				) : (
					<StyledHeaderSvg
						width='100%'
						height='100%'
						preserveAspectRatio='xMidYMid slice'
					/>
				)}
			</StyledHeaderBackground>

			{hasHeroContent && (
				<StyledHeroCard>
					<StyledHeroImage
						source={require('@td/assets/backgrounds/modern-home.png')}
					/>
					{title && <Typography size='Display'>{title}</Typography>}
					{description ? (
						<Typography>{description}</Typography>
					) : null}
				</StyledHeroCard>
			)}
		</StyledHeader>
	);
};
