import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated';

import { Row } from '@td/components/layout/row/row.component';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { StyledCard } from '@td/components/ui/card/card.styles';
import { IconBadge } from '@td/components/ui/icon-badge/icon-badge.component';
import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { IconName } from '@td/components/ui/icon/icon.types';
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
import { getPracticeHref } from '@td/features/journey/journey-practice-route';
import { SurfaceColors } from '@td/theme/colors';
import { Layout } from '@td/theme/layout';
import { Spacing } from '@td/theme/spacing';
import { FormationStructure } from '@td/types/formation/formation-course.types';
import { PracticeCompletionStatus } from '@td/types/journey/journey-day.types';
import { useState } from 'react';
import { useToday } from '../use-today.hook';
import {
	StyledTodaySummaryCard,
	StyledTodaySummaryCards,
} from './today.styles';

const TODAY_PHOTO_HEIGHT = Layout.AuthHeaderHeight * 2;
// Halfway between the original panel overlap and the one-third photo overlap.
const TODAY_BODY_OVERLAP = Math.round(
	(Spacing.Large + TODAY_PHOTO_HEIGHT / 3) / 2,
);

export const TodayScreen = () => {
	const router = useRouter();
	const scrollOffset = useSharedValue(0);
	const photoAnimatedStyle = useAuthHeaderAnimation(
		scrollOffset,
		TODAY_PHOTO_HEIGHT,
	);
	const contentAnimatedStyle = useAnimatedStyle(() => ({
		// Cancel the scroll view’s downward bounce without scaling the text or controls.
		transform: [{ translateY: Math.min(scrollOffset.value, 0) }],
	}));
	const { data, session, practices, error, refresh } = useToday();
	const [bodyHeight, setBodyHeight] = useState(0);
	const completedCount = practices.filter(
		(practice) =>
			practice.completion.status === PracticeCompletionStatus.Complete,
	).length;
	const hour = new Date().getHours();
	const greeting =
		hour < 12
			? 'Good morning'
			: hour < 18
				? 'Good afternoon'
				: 'Good evening';

	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor='transparent'
			contentPadding={0}
			bottomSpacing={Spacing.Small}
			safeAreaEdges={['left', 'right']}
			keyboardEnabled={false}
			testID='today-screen'
			scrollOffset={scrollOffset}
			header={
				<View style={styles.header}>
					<Animated.View
						pointerEvents='none'
						style={[styles.photo, photoAnimatedStyle]}
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
					<Animated.View
						style={[styles.content, contentAnimatedStyle]}
					>
						<StyledAuthHeaderSafeArea
							edges={['top', 'left', 'right']}
						>
							<StyledAuthHeaderContent
								style={styles.headerContent}
							>
								<Row
									fillChildren={false}
									justifyContent='space-between'
									gap={Spacing.Small}
								>
									<View style={{ flex: 1 }}>
										<Typography
											size='Display'
											tone='Inverse'
										>
											{greeting}
											{session?.preferredName
												? `, ${session.preferredName}`
												: ''}
										</Typography>
										<Spacer size={Spacing.XSmall} />
									</View>
									<IconButton
										name={IconName.User}
										hasBackground
										accessibilityLabel='Account settings'
										onPress={() =>
											router.push('/settings/account')
										}
									/>
								</Row>
								<View style={styles.headerDetails}>
									<Row
										justifyContent='flex-end'
										fillChildren={false}
									>
										<View style={{ flex: 1 }}>
											<Typography
												size='H2'
												tone='Inverse'
												align='right'
											>
												“His mercies are new every
												morning.”
											</Typography>
											<Typography
												size='Body2'
												tone='Inverse'
												align='right'
												weight='Regular'
											>
												LAMENTATIONS 3:23
											</Typography>
										</View>
									</Row>
									{session && (
										<StyledTodaySummaryCards>
											<StyledTodaySummaryCard
												onPress={() =>
													router.push('/journey')
												}
											>
												<Typography
													size='H1'
													weight='Semibold'
												>
													Day {session.day.dayNumber}{' '}
													of{' '}
													{
														FormationStructure.DayCount
													}
												</Typography>
												<ProgressBar
													value={
														session.day.dayNumber
													}
													max={
														FormationStructure.DayCount
													}
												/>
											</StyledTodaySummaryCard>
											<StyledTodaySummaryCard
												onPress={() =>
													router.push('/themes')
												}
											>
												<Row
													fillChildren={false}
													gap={Spacing.XSmall}
												>
													<IconBadge
														name={IconName.Note}
													/>
													<View style={{ flex: 1 }}>
														<Typography size='H1'>
															{session.week.title}
														</Typography>
													</View>
												</Row>
											</StyledTodaySummaryCard>
										</StyledTodaySummaryCards>
									)}
								</View>
							</StyledAuthHeaderContent>
						</StyledAuthHeaderSafeArea>
					</Animated.View>
				</View>
			}
		>
			<StyledAuthBodyContainer
				style={[styles.body, { minHeight: bodyHeight || 760 }]}
				onLayout={({ nativeEvent }) => {
					if (session) setBodyHeight(nativeEvent.layout.height);
				}}
			>
				{error && (
					<Card>
						<Typography>{error}</Typography>
						<TurndownButton onPress={() => void refresh()}>
							Refresh practices
						</TurndownButton>
					</Card>
				)}
				{!data && !error && (
					<Typography>Loading today’s practices…</Typography>
				)}
				{data && data.status !== 'Ready' && (
					<Card>
						<Typography>
							{data.status === 'Completed'
								? 'Your 77-day journey is complete.'
								: data.status === 'NotStarted'
									? 'Your journey’s first day hasn’t begun in your current time zone.'
									: 'You don’t have an active journey.'}
						</Typography>
						<TurndownButton onPress={() => router.push('/journey')}>
							View my journey
						</TurndownButton>
					</Card>
				)}
				{session && (
					<>
						<Card variant='Default'>
							<Row>
								<Typography
									size='H1'
									weight='Semibold'
								>
									Today’s Practices
								</Typography>
								<Typography
									size='Body2'
									tone='Muted'
									align='right'
								>
									{completedCount} of {practices.length}{' '}
									complete
								</Typography>
							</Row>
							{practices.map((practice) => (
								<Link
									key={practice.id}
									href={getPracticeHref(
										session.day.journeyId,
										session.day.dayNumber,
										practice.id,
									)}
									asChild
								>
									<StyledCard
										padding={Spacing.Small}
										tone='Neutral'
										variant='Outlined'
										accessibilityLabel={`${practice.title}${practice.completion.status === PracticeCompletionStatus.Complete ? ', complete' : ''}`}
									>
										<Row
											fillChildren={false}
											gap={Spacing.Small}
										>
											<IconBadge
												name={IconName.Note}
												tone='Brand'
											/>
											<View style={{ flex: 1 }}>
												<Typography
													size='H2'
													weight='Semibold'
												>
													{practice.title}
												</Typography>
												<Typography
													tone='Muted'
													weight='Regular'
												>
													{practice.description}
												</Typography>
											</View>
											<Typography tone='Muted'>
												{practice.completion.status ===
												PracticeCompletionStatus.Complete
													? 'Complete'
													: '›'}
											</Typography>
										</Row>
									</StyledCard>
								</Link>
							))}
							<TurndownButton
								size='Large'
								fullWidth
								trailingIconName={IconName.ArrowRight}
								onPress={() => router.push('/journey')}
							>
								View my journey
							</TurndownButton>
						</Card>
						<Spacer size={Spacing.Medium} />
						<Card
							variant='Muted'
							padding={Spacing.Medium}
						>
							<Typography
								size='H1'
								align='center'
							>
								“Abide in me, and I in you.”
							</Typography>
							<Typography
								size='Body2'
								tone='Secondary'
								align='center'
							>
								JOHN 15:4
							</Typography>
						</Card>
					</>
				)}
			</StyledAuthBodyContainer>
		</TurndownScrollScreen>
	);
};

const styles = StyleSheet.create({
	header: {
		// Account for the body panel’s existing negative top margin.
		minHeight: TODAY_PHOTO_HEIGHT - TODAY_BODY_OVERLAP + Spacing.Large,
		// The photo must extend above the layout frame while the scroll view bounces.
		overflow: 'visible',
	},
	photo: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: TODAY_PHOTO_HEIGHT,
		overflow: 'hidden',
	},
	content: { flexGrow: 1 },
	photoFade: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: Spacing.XXLarge,
	},
	headerContent: {
		justifyContent: 'flex-start',
		paddingHorizontal: Spacing.Small,
		paddingTop: Spacing.XSmall,
		paddingBottom: Spacing.Large + Spacing.XSmall,
	},
	headerDetails: {
		width: '100%',
		marginTop: 'auto',
		paddingTop: Spacing.Medium,
	},
	body: {
		marginHorizontal: Spacing.Small,
	},
});
