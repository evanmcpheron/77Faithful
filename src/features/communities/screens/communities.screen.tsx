import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
} from 'react-native-reanimated';

import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { StyledCard } from '@td/components/ui/card/card.styles';
import { Spacer } from '@td/components/ui/spacer/spacer.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { AuthHeaderBackground } from '@td/features/auth/components/auth-header.component';
import { useAuthHeaderAnimation } from '@td/features/auth/hooks/use-auth-header-animation.hook';
import {
	StyledAuthBodyContainer,
	StyledAuthHeaderContent,
	StyledAuthHeaderSafeArea,
} from '@td/features/auth/screens/auth.styles';
import {
	StyledTodaySummaryCard,
	StyledTodaySummaryCards,
} from '@td/features/today/screens/today.styles';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { ICommunitySummary } from '@td/types/community/community.types';
import {
	COMMUNITIES_PHOTO_HEIGHT,
	communitiesStyles as styles,
} from './communities.styles';

// UI state only; membership data must come from an authorized reader when available.
export type TCommunitiesScreenState =
	| { status: 'Loading' }
	| { status: 'Unavailable' }
	| { status: 'Error'; onRetry: () => void }
	| { status: 'Ready'; communities: readonly ICommunitySummary[] };

interface ICommunitiesScreenProps {
	state?: TCommunitiesScreenState;
	headerCards?: readonly [ReactNode, ReactNode];
}

export const CommunitiesScreen = ({
	// No membership service or authorized community read path exists yet.
	state = { status: 'Unavailable' },
	headerCards,
}: ICommunitiesScreenProps) => {
	const router = useRouter();
	const [viewportHeight, setViewportHeight] = useState(0);
	const [headerHeight, setHeaderHeight] = useState(styles.header.minHeight);
	const scrollOffset = useSharedValue(0);
	const reduceMotion = useReducedMotion();
	const photoAnimatedStyle = useAuthHeaderAnimation(
		scrollOffset,
		COMMUNITIES_PHOTO_HEIGHT,
	);
	const titleAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: Math.min(scrollOffset.value, 0) }],
	}));
	const isEmpty = state.status === 'Ready' && state.communities.length === 0;
	const join = () => router.push('/communities/join');
	const create = () => router.push('/communities/create');

	return (
		<View
			style={styles.viewport}
			testID='communities-viewport'
			onLayout={({ nativeEvent }) =>
				setViewportHeight(nativeEvent.layout.height)
			}
		>
			<TurndownScrollScreen
				backgroundColor={SurfaceColors.Screen}
				contentBackgroundColor='transparent'
				scrollOffset={scrollOffset}
				contentPadding={0}
				bottomSpacing={0}
				safeAreaEdges={['left', 'right']}
				keyboardEnabled={false}
				testID='communities-screen'
				header={
					<View
						style={styles.header}
						testID='communities-header'
						onLayout={({ nativeEvent }) =>
							setHeaderHeight(nativeEvent.layout.height)
						}
					>
						<Animated.View
							pointerEvents='none'
							style={[
								styles.photo,
								!reduceMotion && photoAnimatedStyle,
							]}
						>
							<AuthHeaderBackground />
							<LinearGradient
								colors={[
									`${SurfaceColors.Screen}00`,
									SurfaceColors.Screen,
								]}
								style={styles.photoFade}
								accessible={false}
							/>
						</Animated.View>
						<View style={styles.content}>
							<StyledAuthHeaderSafeArea
								edges={['top', 'left', 'right']}
							>
								<StyledAuthHeaderContent
									style={styles.headerContent}
								>
									<Animated.View
										style={[
											styles.title,
											titleAnimatedStyle,
										]}
									>
										<View accessibilityRole='header'>
											<Typography
												size='Display'
												tone='Inverse'
											>
												Communities
											</Typography>
										</View>
										<Spacer size={Spacing.XSmall} />
										<Typography
											tone='Inverse'
											weight='Regular'
										>
											Walk together in faith.
										</Typography>
									</Animated.View>
									<View style={styles.headerDetails}>
										{headerCards && (
											<StyledTodaySummaryCards>
												<StyledTodaySummaryCard>
													{headerCards[0]}
												</StyledTodaySummaryCard>
												<StyledTodaySummaryCard>
													{headerCards[1]}
												</StyledTodaySummaryCard>
											</StyledTodaySummaryCards>
										)}
									</View>
								</StyledAuthHeaderContent>
							</StyledAuthHeaderSafeArea>
						</View>
					</View>
				}
			>
				<StyledAuthBodyContainer
					style={[
						styles.body,
						// The panel overlaps the header, so that space belongs to its available height.
						{
							minHeight: Math.max(
								0,
								viewportHeight - headerHeight + Spacing.Large,
							),
						},
					]}
				>
					<View style={styles.bodyContent}>
						<View style={styles.section}>
							<View accessibilityRole='header'>
								<Typography
									size='H1'
									tone='Primary'
								>
									Your communities
								</Typography>
							</View>
							{state.status === 'Loading' && (
								<View
									accessibilityLiveRegion='polite'
									accessibilityState={{ busy: true }}
								>
									<Card
										tone='Neutral'
										variant='Default'
									>
										<Typography
											tone='Secondary'
											weight='Regular'
										>
											Loading your communities…
										</Typography>
									</Card>
								</View>
							)}
							{(state.status === 'Error' ||
								state.status === 'Unavailable') && (
								<View accessibilityLiveRegion='polite'>
									<Card
										tone='Neutral'
										variant='Default'
									>
										<Typography
											size='H1'
											tone='Primary'
										>
											{state.status === 'Error'
												? 'We couldn’t load your communities.'
												: 'Communities aren’t available yet.'}
										</Typography>
										<Typography
											tone='Secondary'
											weight='Regular'
										>
											{state.status === 'Error'
												? 'Please try again.'
												: 'Your communities will appear here when this is ready.'}
										</Typography>
										{state.status === 'Error' && (
											<TurndownButton
												variant='Outline'
												tone='Brand'
												onPress={state.onRetry}
											>
												Try again
											</TurndownButton>
										)}
									</Card>
								</View>
							)}
							{isEmpty && (
								<Card
									tone='Neutral'
									variant='Default'
									padding={Spacing.Medium}
								>
									<Typography
										size='Display'
										tone='Primary'
									>
										Faith is lived together.
									</Typography>
									<Typography
										tone='Secondary'
										weight='Regular'
									>
										Join a private community with an
										invitation, or create one for people you
										know.
									</Typography>
									<TurndownButton
										variant='Solid'
										onPress={join}
									>
										Join a community
									</TurndownButton>
									<TurndownButton
										variant='Ghost'
										tone='Brand'
										onPress={create}
									>
										Create a community
									</TurndownButton>
								</Card>
							)}
							{state.status === 'Ready' &&
								state.communities.map((community) => (
									<StyledCard
										key={community.communityId}
										padding={Spacing.Medium}
										tone='Neutral'
										variant='Default'
										accessibilityRole='link'
										accessibilityLabel={[
											community.name,
											community.purpose,
											community.organizer.displayName
												? `Organized by ${community.organizer.displayName}`
												: '',
										]
											.filter(Boolean)
											.join('. ')}
										onPress={() =>
											router.push({
												pathname:
													'/communities/[communityId]',
												params: {
													communityId:
														community.communityId,
												},
											})
										}
									>
										<Typography
											size='H1'
											tone='Primary'
										>
											{community.name}
										</Typography>
										<Typography
											tone='Secondary'
											weight='Regular'
										>
											{community.purpose}
										</Typography>
										{community.organizer.displayName.trim() && (
											<Typography
												size='Body2'
												tone='Secondary'
												weight='Regular'
											>
												Organized by{' '}
												{
													community.organizer
														.displayName
												}
											</Typography>
										)}
									</StyledCard>
								))}
						</View>
						{!isEmpty && (
							<View style={styles.actions}>
								<TurndownButton
									variant='Outline'
									tone='Brand'
									onPress={join}
								>
									Join a community
								</TurndownButton>
								<TurndownButton
									variant='Ghost'
									tone='Brand'
									onPress={create}
								>
									Create a community
								</TurndownButton>
							</View>
						)}
					</View>
				</StyledAuthBodyContainer>
			</TurndownScrollScreen>
		</View>
	);
};
