import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Typography } from '@td/components/ui/typography/typography.component';
import { setupPractices } from '@td/features/journey-setup/journey-setup-content';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import { FormationStructure } from '@td/types/formation/formation-course.types';
import {
	FoundationalPracticeId,
	type TFoundationalPracticeId,
} from '@td/types/formation/practice.types';
import type { ITranslatedScripturePassage } from '@td/types/formation/scripture.types';
import { PracticeCompletionStatus } from '@td/types/journey/journey-day.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import styled from 'styled-components/native';
import { parsePracticeRoute } from '../journey-practice-route';
import { useJourneyPractice } from '../use-journey-practice.hook';

const ReadingColumn = styled(View)({
	width: '100%',
	maxWidth: 720,
	alignSelf: 'center',
	gap: Spacing.Medium,
});

const ScripturePassage = ({
	passage,
}: {
	passage: ITranslatedScripturePassage;
}) => (
	<Card variant='Default'>
		<Typography size='H2'>{passage.displayReference}</Typography>
		{passage.paragraphs.map((paragraph, index) => (
			<Typography
				key={index}
				weight='Regular'
			>
				{paragraph.runs.map((run, runIndex) => (
					<Typography
						key={runIndex}
						weight='Regular'
					>
						{run.verseLabel && (
							<Typography
								size='Body2'
								tone='Muted'
							>
								{run.verseLabel}{' '}
							</Typography>
						)}
						{run.text}
					</Typography>
				))}
			</Typography>
		))}
		{passage.versificationNote && (
			<Typography
				size='Body2'
				tone='Muted'
			>
				{passage.versificationNote}
			</Typography>
		)}
	</Card>
);

export const JourneyPracticeScreen = ({
	foundationalPractice,
}: {
	foundationalPractice?: TFoundationalPracticeId;
}) => {
	const params = useLocalSearchParams();
	const router = useRouter();
	const route = parsePracticeRoute(
		params['journeyId'],
		params['dayNumber'],
		foundationalPractice ?? params['practiceId'],
	);
	const {
		session,
		practice,
		completion,
		loading,
		isSaving,
		error,
		refresh,
		complete,
	} = useJourneyPractice(route);
	const definition = setupPractices.find(
		(item) => item.practiceId === practice?.id,
	);
	const isComplete = completion?.status === PracticeCompletionStatus.Complete;
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentPadding={Spacing.Small}
			bottomSpacing={Spacing.Large}
			testID='journey-practice-screen'
		>
			<ReadingColumn>
				<TurndownButton
					variant='Ghost'
					leadingIconName={IconName.ArrowLeft}
					onPress={() => router.dismissTo('/today')}
				>
					Back to Today
				</TurndownButton>
				{!route ? (
					<Typography>This practice link isn’t available.</Typography>
				) : (
					<>
						{loading && !session && (
							<Typography>Loading your practice…</Typography>
						)}
						{error && (
							<Card>
								<Typography>{error}</Typography>
								<TurndownButton
									disabled={isSaving || loading}
									onPress={() => void refresh()}
								>
									Refresh practice
								</TurndownButton>
							</Card>
						)}
						{session && practice && (
							<>
								<Typography tone='Muted'>
									Day {session.day.dayNumber} of{' '}
									{FormationStructure.DayCount}
								</Typography>
								<Typography size='Display'>
									{practice.title}
								</Typography>
								{practice.id ===
									FoundationalPracticeId.ReadScripture && (
									<>
										<Typography tone='Secondary'>
											{session.translation.name} (
											{session.translation.abbreviation})
										</Typography>
										{session.scripture ? (
											<>
												<ScripturePassage
													passage={
														session.scripture
															.primaryPassage
													}
												/>
												{session.scripture
													.supportingPassage && (
													<ScripturePassage
														passage={
															session.scripture
																.supportingPassage
														}
													/>
												)}
											</>
										) : (
											<Card>
												<Typography size='H2'>
													{session.scriptureReference}
												</Typography>
												<Typography>
													{session.scriptureAvailabilityMessage ??
														'This passage isn’t available in the app. You can read it in your Bible.'}
												</Typography>
											</Card>
										)}
										{session.acknowledgments.map(
											(text, index) => (
												<Typography
													key={index}
													size='Body2'
													tone='Muted'
												>
													{text}
												</Typography>
											),
										)}
										<Card>
											<Typography size='H2'>
												Devotional
											</Typography>
											<Typography weight='Regular'>
												{session.content.devotional}
											</Typography>
										</Card>
									</>
								)}
								{practice.id ===
									FoundationalPracticeId.Pray && (
									<>
										<Card>
											<Typography size='H2'>
												Prayer prompt
											</Typography>
											<Typography weight='Regular'>
												{session.content.prayerPrompt}
											</Typography>
										</Card>
										<Card variant='Default'>
											<Typography size='H2'>
												A prayer for today
											</Typography>
											<Typography weight='Regular'>
												{session.content.writtenPrayer}
											</Typography>
										</Card>
									</>
								)}
								{practice.id ===
									FoundationalPracticeId.Reflect && (
									<>
										<Card variant='Default'>
											<Typography size='H2'>
												Reflection
											</Typography>
											<Typography weight='Regular'>
												{
													session.content
														.reflectionQuestion
												}
											</Typography>
										</Card>
										{session.content
											.intentionInvitation && (
											<Card>
												<Typography size='H2'>
													An invitation for today
												</Typography>
												<Typography weight='Regular'>
													{
														session.content
															.intentionInvitation
													}
												</Typography>
											</Card>
										)}
									</>
								)}
								{definition && (
									<Card variant='Default'>
										<Typography weight='Regular'>
											{definition.purpose}
										</Typography>
										<Typography size='H2'>
											Ways to practice
										</Typography>
										{definition.examples.map((example) => (
											<Typography
												key={example}
												weight='Regular'
											>
												{example}
											</Typography>
										))}
									</Card>
								)}
								<TurndownButton
									fullWidth
									size='Large'
									loading={isSaving}
									disabled={
										loading ||
										isSaving ||
										!!error ||
										isComplete
									}
									onPress={() => void complete()}
								>
									{isComplete ? 'Completed' : 'Complete'}
								</TurndownButton>
								{isComplete && (
									<TurndownButton
										variant='Outline'
										fullWidth
										onPress={() =>
											router.dismissTo('/today')
										}
									>
										Back to Today
									</TurndownButton>
								)}
							</>
						)}
					</>
				)}
			</ReadingColumn>
		</TurndownScrollScreen>
	);
};
