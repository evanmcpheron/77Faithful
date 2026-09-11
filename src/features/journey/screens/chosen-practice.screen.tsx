import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { setupPractices } from '@td/features/journey-setup/journey-setup-content';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import {
	FoundationalPracticeId,
	OptionalPracticeId,
} from '@td/types/formation/practice.types';
import { PracticeCompletionStatus } from '@td/types/journey/journey-day.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { getPracticeHref, parsePracticeRoute } from '../journey-practice-route';
import { useJourneyPractice } from '../use-journey-practice.hook';
import { chosenPracticeContent } from './chosen-practice-content';
import { MovementExamples, MovementGuidance } from './movement-guidance';
import {
	movementColumnStyle,
	movementHeadingStyle,
	movementPurposeStyle,
	movementTitleStyle,
} from './movement.styles';
import {
	PassageSection,
	ReadingColumn,
	ReadingTitle,
	scriptureTitleStyle,
} from './scripture.styles';

export const ChosenPracticeScreen = () => {
	const headerHeight = useHeaderHeight();
	const params = useLocalSearchParams();
	const router = useRouter();
	const practiceId = Object.values(OptionalPracticeId).find(
		(id) => id === params['practiceId'],
	);
	const isPreview = params['preview'] === '1';
	const previewDefinition = isPreview
		? setupPractices.find(
				(definition) => definition.practiceId === practiceId,
			)
		: undefined;
	const route = parsePracticeRoute(
		params['journeyId'],
		params['dayNumber'],
		practiceId,
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
	} = useJourneyPractice(
		isPreview && route
			? { ...route, practiceId: FoundationalPracticeId.ReadScripture }
			: route,
	);
	const guidance = practiceId ? chosenPracticeContent[practiceId] : null;
	const isComplete =
		!isPreview && completion?.status === PracticeCompletionStatus.Complete;
	const isMovement = practiceId === OptionalPracticeId.Movement;
	const completionLabel = isPreview
		? 'Preview only'
		: isMovement && isSaving
			? 'Marking complete…'
			: isComplete
				? 'Completed'
				: 'Mark complete';
	const completionAccessibilityLabel =
		!isMovement || isPreview
			? undefined
			: isComplete
				? 'Movement completed'
				: isSaving
					? 'Marking Movement complete'
					: 'Mark Movement complete';
	const completionButton = (
		<TurndownButton
			fullWidth
			size='Large'
			loading={isSaving}
			accessibilityLabel={completionAccessibilityLabel ?? completionLabel}
			disabled={isPreview || loading || isSaving || !!error || isComplete}
			onPress={() => {
				if (!isPreview) void complete();
			}}
		>
			{completionLabel}
		</TurndownButton>
	);
	return (
		<TurndownScrollScreen
			backgroundColor={
				isMovement ? SurfaceColors.Card : SurfaceColors.Screen
			}
			contentPadding={isMovement ? Spacing.Small : Spacing.Medium}
			bottomSpacing={Spacing.Large}
			safeAreaEdges={['right', 'bottom', 'left']}
			testID='chosen-practice-screen'
		>
			<ReadingColumn
				style={[
					{ paddingTop: headerHeight },
					isMovement && movementColumnStyle,
				]}
			>
				{!route && (
					<Typography>This practice link isn’t available.</Typography>
				)}
				{route && loading && !session && (
					<Typography>Loading your practice…</Typography>
				)}
				{error && (
					<Card>
						<Typography>{error}</Typography>
						<TurndownButton
							disabled={loading || isSaving}
							accessibilityLabel={
								isMovement
									? 'Refresh Movement practice'
									: 'Refresh practice'
							}
							onPress={() => void refresh()}
						>
							Refresh practice
						</TurndownButton>
					</Card>
				)}
				{route && session && practice && guidance && (
					<>
						{isPreview && (
							<Typography tone='Muted'>
								{isMovement
									? 'Practice preview. This does not change your chosen practices.'
									: 'Practice preview · This does not change your chosen practices.'}
							</Typography>
						)}
						<ReadingTitle
							style={
								isMovement ? movementHeadingStyle : undefined
							}
						>
							<PassageSection
								accessible
								accessibilityRole='header'
							>
								<Typography
									size='Display'
									align={isMovement ? 'left' : 'center'}
									weight='Regular'
									style={
										isMovement
											? movementTitleStyle
											: scriptureTitleStyle
									}
								>
									{isMovement
										? 'Movement'
										: (previewDefinition?.name ??
											practice.title)}
								</Typography>
							</PassageSection>
							<Typography
								align={isMovement ? 'left' : 'center'}
								weight={isMovement ? 'Regular' : 'Bold'}
								tone='Secondary'
								style={
									isMovement
										? movementPurposeStyle
										: undefined
								}
							>
								{guidance.purpose}
							</Typography>
						</ReadingTitle>
						{isMovement ? (
							<MovementGuidance
								invitation={guidance.invitation}
							/>
						) : (
							<PassageSection>
								<Typography
									size='H1'
									style={scriptureTitleStyle}
								>
									Begin here
								</Typography>
								<Typography>{guidance.invitation}</Typography>
							</PassageSection>
						)}
						{!isMovement && completionButton}
						{isMovement ? (
							<>
								<MovementExamples
									examples={guidance.examples}
								/>
								{completionButton}
							</>
						) : (
							<PassageSection>
								<Typography
									size='H1'
									style={scriptureTitleStyle}
								>
									Ways to practice
								</Typography>
								{guidance.examples.map((example) => (
									<Typography
										key={example}
										tone='Secondary'
									>
										{example}
									</Typography>
								))}
							</PassageSection>
						)}
						{practiceId ===
							OptionalPracticeId.FamilyOrHouseholdDevotion && (
							<PassageSection>
								<Typography tone='Secondary'>
									You can use this day’s assigned Scripture:{' '}
									{session.scriptureReference}.
								</Typography>
								<TurndownButton
									variant='Outline'
									onPress={() =>
										router.push(
											getPracticeHref(
												session.day.journeyId,
												session.day.dayNumber,
												FoundationalPracticeId.ReadScripture,
											),
										)
									}
								>
									Open assigned Scripture
								</TurndownButton>
							</PassageSection>
						)}
					</>
				)}
			</ReadingColumn>
		</TurndownScrollScreen>
	);
};
