import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
} from 'react-native-reanimated';

import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { NavigationActionList } from '@td/components/ui/navigation-action-list/navigation-action-list.component';
import { ProgressBar } from '@td/components/ui/progress-bar/progress-bar.component';
import { Spacer } from '@td/components/ui/spacer/spacer.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { AuthHeaderBackground } from '@td/features/auth/components/auth-header.component';
import { useAuthHeaderAnimation } from '@td/features/auth/hooks/use-auth-header-animation.hook';
import {
	StyledAuthBodyContainer,
	StyledAuthHeaderContent,
	StyledAuthHeaderSafeArea,
} from '@td/features/auth/screens/auth.styles';
import { useToday } from '@td/features/today/use-today.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import { FormationStructure } from '@td/types/formation/formation-course.types';

import {
	JOURNEY_PHOTO_HEIGHT,
	StyledJourneyContent,
	StyledJourneySection,
	journeyStyles as styles,
} from './journey.styles';

export const JourneyScreen = () => {
	const router = useRouter();
	const [viewportHeight, setViewportHeight] = useState(0);
	const [headerHeight, setHeaderHeight] = useState(styles.header.minHeight);
	const scrollOffset = useSharedValue(0);
	const reduceMotion = useReducedMotion();
	const photoAnimatedStyle = useAuthHeaderAnimation(
		scrollOffset,
		JOURNEY_PHOTO_HEIGHT,
	);
	const titleAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: Math.min(scrollOffset.value, 0) }],
	}));
	const { data, session, error, refresh } = useToday();

	return (
		<View
			style={styles.viewport}
			testID='journey-viewport'
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
				testID='journey-screen'
				header={
					<View
						style={styles.header}
						testID='journey-header'
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
												Journey
											</Typography>
										</View>
										<Spacer size={Spacing.XSmall} />
										<Typography
											tone='Inverse'
											weight='Regular'
										>
											A daily rhythm of Scripture, prayer,
											and life with Christ.
										</Typography>
									</Animated.View>
									<View style={styles.headerDetails} />
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
					<StyledJourneyContent>
						{!data && !error && (
							<View
								accessibilityLiveRegion='polite'
								accessibilityState={{ busy: true }}
							>
								<Typography>Loading your journey…</Typography>
							</View>
						)}
						{error && (
							<View accessibilityLiveRegion='polite'>
								<Card>
									<Typography>
										We couldn’t load your journey. Check
										your connection and try again.
									</Typography>
									<TurndownButton
										variant='Outline'
										onPress={() => void refresh()}
									>
										Try again
									</TurndownButton>
								</Card>
							</View>
						)}
						{data && !error && (
							<>
								{session && (
									<>
										<Card>
											<Typography
												size='Body2'
												tone='Secondary'
											>
												Your 77-day journey
											</Typography>
											<Typography size='H1'>
												Day {session.day.dayNumber} of{' '}
												{FormationStructure.DayCount}
											</Typography>
											<ProgressBar
												value={session.day.dayNumber}
												max={
													FormationStructure.DayCount
												}
												label={`Calendar day ${session.day.dayNumber} of ${FormationStructure.DayCount}`}
											/>
											<Typography
												size='Body2'
												tone='Secondary'
												weight='Regular'
											>
												Your journey follows the
												calendar. Missing a day never
												resets it.
											</Typography>
											<TurndownButton
												onPress={() =>
													router.push('/today')
												}
											>
												Return to Today
											</TurndownButton>
										</Card>
										<StyledJourneySection>
											<Typography size='H1'>
												This week
											</Typography>
											<Card variant='Muted'>
												<Typography
													size='Body2'
													tone='Secondary'
												>
													Week{' '}
													{session.week.weekNumber} of{' '}
													{
														FormationStructure.WeekCount
													}
												</Typography>
												<Typography size='H2'>
													{session.week.title}
												</Typography>
												<Typography
													tone='Secondary'
													weight='Regular'
												>
													{session.week.description}
												</Typography>
											</Card>
										</StyledJourneySection>
									</>
								)}

								{data && data.status !== 'Ready' && (
									<Card>
										<Typography size='H1'>
											{data.status === 'Completed'
												? 'Your 77-day journey is complete'
												: data.status === 'NotStarted'
													? 'Your journey’s first day'
													: 'No active journey'}
										</Typography>
										<Typography
											tone='Secondary'
											weight='Regular'
										>
											{data.status === 'Completed'
												? 'Take time to reflect on these days with Christ.'
												: data.status === 'NotStarted'
													? 'Day 1 hasn’t begun in your current time zone. Your journey will be available when that day begins.'
													: 'You don’t have an active 77-day journey right now.'}
										</Typography>
									</Card>
								)}

								<StyledJourneySection>
									<Typography size='H1'>
										Explore your journey
									</Typography>
									<NavigationActionList
										actions={[
											{
												id: 'themes',
												title: 'Weekly themes',
												iconName: IconName.Note,
												onPress: () =>
													router.push('/themes'),
											},
											{
												id: 'reflections',
												title: 'Reflections',
												iconName: IconName.Lock,
												onPress: () =>
													router.push('/reflections'),
											},
										]}
									/>
									<Typography
										size='Body2'
										tone='Secondary'
										weight='Regular'
									>
										Your reflections and personal writing
										remain private.
									</Typography>
								</StyledJourneySection>
								<Typography
									size='Body2'
									tone='Muted'
									weight='Regular'
								>
									These practices make room to respond to
									God’s grace. They do not earn His favor.
								</Typography>
							</>
						)}
					</StyledJourneyContent>
				</StyledAuthBodyContainer>
			</TurndownScrollScreen>
		</View>
	);
};
