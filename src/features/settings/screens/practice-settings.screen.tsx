import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { setupPractices } from '@td/features/journey-setup/journey-setup-content';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type {
	IPracticeDefinition,
	TOptionalPracticeId,
} from '@td/types/formation/practice.types';
import { useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { usePracticeSettings } from '../use-practice-settings.hook';
import { accountStyles as styles } from './account.styles';
import {
	PracticeChangeEditor,
	PracticeChangeFeedback,
} from './practice-change-editor';
import { practiceSettingsStyles } from './practice-settings.styles';

const PracticeGuidance = ({
	practice,
	chosen = false,
}: {
	practice: IPracticeDefinition;
	chosen?: boolean;
}) => {
	const [expanded, setExpanded] = useState(false);
	return (
		<Card variant={chosen ? 'Muted' : 'Outlined'}>
			<View style={styles.section}>
				<Pressable
					accessibilityRole='button'
					accessibilityLabel={`${expanded ? 'Hide' : 'Show'} ${practice.name} guidance`}
					accessibilityState={{ expanded }}
					onPress={() => setExpanded(!expanded)}
					style={practiceSettingsStyles.guidanceTrigger}
				>
					<Typography size='H3'>{practice.name}</Typography>
					<Typography
						size='Body2'
						tone='Secondary'
						weight='Regular'
					>
						{practice.purpose}
					</Typography>
					<Typography
						size='Body2'
						tone='Brand'
					>
						{expanded ? 'Hide guidance' : 'Explore this practice'}
					</Typography>
				</Pressable>
				{expanded && (
					<View style={styles.section}>
						<Typography weight='Semibold'>
							Ways to practice
						</Typography>
						{practice.examples.map((example) => (
							<Typography
								key={example}
								weight='Regular'
							>
								{example}
							</Typography>
						))}
						<Typography
							size='Body2'
							tone='Secondary'
							weight='Regular'
						>
							{practice.boundaries}
						</Typography>
					</View>
				)}
			</View>
		</Card>
	);
};

export const PracticeSettingsScreen = () => {
	const headerHeight = useHeaderHeight();
	const router = useRouter();
	const settings = usePracticeSettings();
	const { data, error, refresh } = settings;
	const session = data?.status === 'Ready' ? data : null;
	const assignedIds: readonly TOptionalPracticeId[] =
		!error && session ? session.selection.currentOptionalPracticeIds : [];
	const chosenPractices = setupPractices.filter((practice) =>
		assignedIds.includes(practice.practiceId),
	);
	const otherPractices = setupPractices.filter(
		(practice) => !assignedIds.includes(practice.practiceId),
	);
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			testID='practice-settings-screen'
		>
			<View style={{ paddingTop: headerHeight }}>
				<View style={styles.column}>
					<View style={styles.heading}>
						<View accessibilityRole='header'>
							<Typography size='Display'>Practices</Typography>
						</View>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							Make room each day to turn toward Jesus through
							Scripture, prayer, and ordinary acts of faith.
						</Typography>
					</View>
					<View style={styles.section}>
						<View accessibilityRole='header'>
							<Typography size='H2'>
								Foundational Practices
							</Typography>
						</View>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							These three practices are part of every day of your
							journey.
						</Typography>
						<Card>
							<View style={styles.section}>
								<Typography size='H3'>
									Read Scripture
								</Typography>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									Listen to God’s Word and consider what it
									shows you about following Jesus.
								</Typography>
								<Typography size='H3'>Pray</Typography>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									Turn to God with praise, thanks, and the
									needs on your heart.
								</Typography>
								<Typography size='H3'>Reflect</Typography>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									Consider today’s Scripture and your response
									to it. Your writing remains private.
								</Typography>
							</View>
						</Card>
					</View>
					<View style={styles.section}>
						<View accessibilityRole='header'>
							<Typography size='H2'>Chosen Practices</Typography>
						</View>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							Two to four additional practices join your
							Foundational Practices, for five to seven daily
							practices.
						</Typography>
						{error ? (
							<Card>
								<View
									style={styles.section}
									accessibilityLiveRegion='polite'
								>
									<Typography weight='Regular'>
										{error}
									</Typography>
									<TurndownButton
										variant='Outline'
										onPress={() => void refresh()}
									>
										Try again
									</TurndownButton>
								</View>
							</Card>
						) : !data ? (
							<View accessibilityLiveRegion='polite'>
								<Typography tone='Secondary'>
									Loading your practices…
								</Typography>
							</View>
						) : session ? (
							<>
								<Typography
									size='Body2'
									tone='Secondary'
								>
									Day {session.dayNumber} ·{' '}
									{chosenPractices.length} Chosen Practices
								</Typography>
								{chosenPractices.map((practice) => (
									<PracticeGuidance
										key={practice.practiceId}
										practice={practice}
										chosen
									/>
								))}
							</>
						) : (
							<Card>
								<View style={styles.section}>
									<Typography weight='Regular'>
										{data.status === 'Completed'
											? 'Your 77-day period is complete. You can review your journey and its practices in Journey.'
											: data.status === 'NotStarted'
												? 'Your journey’s practices are not available for today yet.'
												: 'You don’t have an active journey. You can explore the practices below and choose yours during journey setup.'}
									</Typography>
									<TurndownButton
										variant='Outline'
										onPress={() => router.push('/journey')}
									>
										Go to Journey
									</TurndownButton>
								</View>
							</Card>
						)}
					</View>
					{session && (
						<PracticeChangeEditor
							key={`${session.selection.journeyId}:${session.dayNumber}:${session.calendarDate}:${session.selection.scheduleRevision}:${settings.reviewVersion}`}
							data={session}
							settings={settings}
						/>
					)}
					<PracticeChangeFeedback settings={settings} />
					<View style={styles.section}>
						<View accessibilityRole='header'>
							<Typography size='H2'>
								Explore{' '}
								{chosenPractices.length
									? 'other practices'
									: 'the practices'}
							</Typography>
						</View>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							Learn what each practice can look like in your life.
						</Typography>
						{otherPractices.map((practice) => (
							<PracticeGuidance
								key={practice.practiceId}
								practice={practice}
							/>
						))}
					</View>
					<Typography
						size='Body2'
						tone='Secondary'
						weight='Regular'
						align='center'
					>
						These practices do not earn God’s favor. An incomplete
						day does not reset your journey.
					</Typography>
				</View>
			</View>
		</TurndownScrollScreen>
	);
};
