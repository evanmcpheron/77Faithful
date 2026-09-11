import BookOpenIcon from '@td/assets/icons/reading/book-open.svg';
import ShareIcon from '@td/assets/icons/reading/share.svg';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { StyledIconButton } from '@td/components/ui/icon-button/icon-button.styles';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Typography } from '@td/components/ui/typography/typography.component';
import { SurfaceColors, TextColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import { FoundationalPracticeId } from '@td/types/formation/practice.types';
import type { ITranslatedScripturePassage } from '@td/types/formation/scripture.types';
import { PracticeCompletionStatus } from '@td/types/journey/journey-day.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import { Share } from 'react-native';
import type { IJourneyDaySession } from '../journey-day-session.types';
import { parsePracticeRoute } from '../journey-practice-route';
import { getScriptureChapters, isAssignedVerse } from '../scripture-chapters';
import { useJourneyPractice } from '../use-journey-practice.hook';
import {
	PassageSection,
	ReadingAction,
	ReadingActions,
	ReadingColumn,
	ReadingTitle,
	ScriptureLeaf,
	ScriptureQuote,
	VerseRow,
	VerseText,
	quoteStyle,
	scriptureHeroStyle,
	scriptureTextStyle,
	scriptureTitleStyle,
} from './scripture.styles';

// Metro resolves bundled PNG assets through a static require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const scriptureLeaf: number = require('@td/assets/images/scripture-leaf.png');

const ScriptureReading = ({ session }: { session: IJourneyDaySession }) => {
	const [showChapter, setShowChapter] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const assignment = session.scripture;
	const assigned: ITranslatedScripturePassage[] = assignment
		? [
				assignment.primaryPassage,
				...(assignment.supportingPassage
					? [assignment.supportingPassage]
					: []),
			]
		: [];
	const chapters = assignment ? getScriptureChapters(assignment) : null;
	const visible = showChapter && chapters ? chapters : assigned;
	const firstVerse = assigned[0]?.paragraphs[0].runs[0];
	const share = async () => {
		setActionError(null);
		try {
			await Share.share({
				message: [
					`${session.scriptureReference} (${session.translation.abbreviation})`,
					...assigned.map((passage) =>
						passage.paragraphs
							.map((paragraph) =>
								paragraph.runs.map((run) => run.text).join(' '),
							)
							.join('\n\n'),
					),
				].join('\n\n'),
			});
		} catch {
			setActionError('We couldn’t share this passage. Please try again.');
		}
	};
	return (
		<>
			<ReadingTitle>
				<ScriptureLeaf
					source={scriptureLeaf}
					contentFit='contain'
					accessible={false}
				/>
				<Typography
					tone='Secondary'
					align='center'
				>
					TODAY’S SCRIPTURE
				</Typography>
				<Typography
					size='Display'
					weight='Regular'
					align='center'
					style={scriptureHeroStyle}
				>
					{session.scriptureReference}
				</Typography>
				<Typography
					tone='Secondary'
					align='center'
				>
					{session.translation.abbreviation}
				</Typography>
			</ReadingTitle>
			{visible.map((passage) => (
				<PassageSection key={passage.passageId}>
					{visible.length > 1 && (
						<Typography
							size='H1'
							style={scriptureTitleStyle}
						>
							{passage.displayReference}
						</Typography>
					)}
					{passage.paragraphs.map((paragraph, index) => (
						<PassageSection key={index}>
							{paragraph.runs.map((run, runIndex) => {
								const highlighted =
									showChapter &&
									isAssignedVerse(passage, run, assigned);
								return (
									<VerseRow
										key={runIndex}
										$highlighted={highlighted}
										testID={
											highlighted
												? 'assigned-verse-highlight'
												: undefined
										}
										accessibilityLabel={
											highlighted
												? 'Assigned passage'
												: undefined
										}
									>
										{run.verseLabel && (
											<Typography
												size='Body2'
												tone='Muted'
											>
												{run.verseLabel}
											</Typography>
										)}
										<VerseText>
											<Typography
												style={scriptureTextStyle}
											>
												{run.text}
											</Typography>
										</VerseText>
									</VerseRow>
								);
							})}
						</PassageSection>
					))}
					{passage.versificationNote && (
						<Typography tone='Muted'>
							{passage.versificationNote}
						</Typography>
					)}
				</PassageSection>
			))}
			{!assignment && (
				<Card>
					<Typography>
						{session.scriptureAvailabilityMessage ??
							'This passage isn’t available in the app. You can read it in your Bible.'}
					</Typography>
				</Card>
			)}
			{firstVerse && (
				<ScriptureQuote
					variant='Muted'
					tone='Neutral'
					padding={Spacing.Small}
				>
					<Typography
						align='center'
						style={quoteStyle}
					>
						{firstVerse.text}
					</Typography>
					<Typography
						align='center'
						tone='Secondary'
					>
						{assigned[0]?.displayReference.match(/^(.+?) \d/)?.[1]}{' '}
						{firstVerse.verseLabel}
					</Typography>
				</ScriptureQuote>
			)}
			<ReadingActions>
				<ReadingAction>
					<StyledIconButton
						variant='Soft'
						tone='Brand'
						size='Large'
						hasBackground
						accessibilityRole='button'
						accessibilityLabel={
							showChapter
								? 'Show assigned passage'
								: 'Read whole chapter'
						}
						accessibilityState={{
							disabled: !chapters,
							expanded: showChapter,
						}}
						disabled={!chapters}
						onPress={() => setShowChapter((value) => !value)}
					>
						<BookOpenIcon
							width={IconSizes.XLarge}
							height={IconSizes.XLarge}
							color={TextColors.Primary}
						/>
					</StyledIconButton>
					<Typography align='center'>
						{showChapter
							? 'Show assigned passage'
							: 'Read whole chapter'}
					</Typography>
				</ReadingAction>
				<ReadingAction>
					<StyledIconButton
						variant='Soft'
						tone='Brand'
						size='Large'
						hasBackground
						accessibilityRole='button'
						accessibilityLabel='Share'
						accessibilityState={{ disabled: !assignment }}
						disabled={!assignment}
						onPress={() => void share()}
					>
						<ShareIcon
							width={IconSizes.XLarge}
							height={IconSizes.XLarge}
							color={TextColors.Primary}
						/>
					</StyledIconButton>
					<Typography align='center'>Share</Typography>
				</ReadingAction>
			</ReadingActions>
			{assignment && !chapters && (
				<Typography tone='Muted'>
					The full chapter isn’t available in this edition yet. You
					can read it in your Bible.
				</Typography>
			)}
			{actionError && <Typography tone='Error'>{actionError}</Typography>}
		</>
	);
};

export const ScriptureScreen = () => {
	const headerHeight = useHeaderHeight();
	const params = useLocalSearchParams();
	const router = useRouter();
	const route = parsePracticeRoute(
		params['journeyId'],
		params['dayNumber'],
		FoundationalPracticeId.ReadScripture,
	);
	const { session, completion, loading, isSaving, error, refresh, complete } =
		useJourneyPractice(route);
	const isComplete = completion?.status === PracticeCompletionStatus.Complete;
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentPadding={Spacing.Medium}
			bottomSpacing={Spacing.Large}
			safeAreaEdges={['right', 'bottom', 'left']}
			testID='scripture-screen'
		>
			<ReadingColumn style={{ paddingTop: headerHeight }}>
				{!route && (
					<Typography>This practice link isn’t available.</Typography>
				)}
				{route && loading && !session && (
					<Typography>Loading your Scripture reading…</Typography>
				)}
				{error && (
					<Card>
						<Typography>{error}</Typography>
						<TurndownButton
							disabled={loading || isSaving}
							onPress={() => void refresh()}
						>
							Refresh reading
						</TurndownButton>
					</Card>
				)}
				{session && (
					<>
						<ScriptureReading
							key={`${session.day.journeyId}-${session.day.dayNumber}-${session.scripture?.scriptureAssignmentId}-${session.scripture?.bibleTextEditionId}`}
							session={session}
						/>
						<TurndownButton
							fullWidth
							size='Large'
							loading={isSaving}
							disabled={
								loading || isSaving || !!error || isComplete
							}
							onPress={() => void complete()}
						>
							{isComplete ? 'Completed' : 'Complete reading'}
						</TurndownButton>
						{isComplete && (
							<TurndownButton
								fullWidth
								variant='Outline'
								trailingIconName={IconName.ArrowRight}
								onPress={() => router.navigate('/today')}
							>
								Continue
							</TurndownButton>
						)}
					</>
				)}
			</ReadingColumn>
		</TurndownScrollScreen>
	);
};
