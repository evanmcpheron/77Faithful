import LeafIcon from '@td/assets/icons/prayer/leaf.svg';
import BookIcon from '@td/assets/icons/reading/book-open.svg';
import LockIcon from '@td/assets/icons/regular/lock.svg';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { SurfaceColors, TextColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import { FoundationalPracticeId } from '@td/types/formation/practice.types';
import { PracticeCompletionStatus } from '@td/types/journey/journey-day.types';
import { WritingKind } from '@td/types/journey/journey-writing.types';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';
import type { IJourneyDaySession } from '../journey-day-session.types';
import { parsePracticeRoute } from '../journey-practice-route';
import { saveJourneyReflection } from '../journey-reflection.service';
import { useJourneyPractice } from '../use-journey-practice.hook';
import { prayerTitleStyle } from './prayer.styles';
import {
	ReflectionAction,
	ReflectionActions,
	ReflectionColumn,
	ReflectionField,
	ReflectionIcon,
	ReflectionInput,
	ReflectionIntro,
	ReflectionPrivacy,
	ReflectionPrivacyText,
	ReflectionRow,
	ReflectionText,
} from './reflection.styles';
import { ScriptureLeaf } from './scripture.styles';

// Metro resolves bundled images through a static require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const reflectionLeaf: number = require('@td/assets/images/scripture-leaf.png');

interface IReflectionEditorProps {
	session: IJourneyDaySession;
	disabled: boolean;
	isComplete: boolean;
	complete: () => Promise<void>;
}
const ReflectionEditor = ({
	session,
	disabled,
	isComplete,
	complete,
}: IReflectionEditorProps) => {
	const [text, setText] = useState(session.day.reflection?.text ?? '');
	const [head, setHead] = useState(session.day.reflection);
	const [saving, setSaving] = useState(false);
	const [focused, setFocused] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const busy = useRef(false);
	const active = useRef(true);
	useFocusEffect(
		useCallback(() => {
			active.current = true;
			return () => {
				active.current = false;
			};
		}, []),
	);
	const changed = text !== (head?.text ?? '');
	const save = async (markComplete: boolean) => {
		if (busy.current || disabled) return;
		busy.current = true;
		setSaving(true);
		setError(null);
		setMessage(null);
		try {
			if (changed) {
				const result = await saveJourneyReflection({
					target: {
						kind: WritingKind.DailyReflection,
						journeyId: session.day.journeyId,
						dayNumber: session.day.dayNumber,
					},
					expectedRevisionId: head?.revisionId ?? null,
					text,
				});
				setHead(result.currentWriting);
				setMessage('Your draft is saved to your account.');
			}
			if (markComplete && active.current) await complete();
		} catch {
			setError(
				'We couldn’t confirm that your reflection was saved. Your words are still on this screen. Keep them here and try saving again.',
			);
		} finally {
			busy.current = false;
			setSaving(false);
		}
	};
	return (
		<>
			<ReflectionField>
				<ReflectionInput
					isFocused={focused}
					multiline
					maxLength={10000}
					scrollEnabled={false}
					accessibilityLabel='Your reflection'
					placeholder='Take a few minutes to write your thoughts here…'
					placeholderTextColor={TextColors.Muted}
					value={text}
					editable={!saving && !disabled}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					onChangeText={(value) => {
						setText(value);
						setMessage(null);
					}}
				/>
				<ReflectionPrivacy>
					<LockIcon
						width={IconSizes.Small}
						height={IconSizes.Small}
						color={TextColors.Muted}
					/>
					<ReflectionPrivacyText>
						<Typography
							tone='Muted'
							align='right'
						>
							Your reflection is private.
						</Typography>
					</ReflectionPrivacyText>
				</ReflectionPrivacy>
			</ReflectionField>
			{message && <Typography tone='Secondary'>{message}</Typography>}
			{error && <Typography tone='Error'>{error}</Typography>}
			<ReflectionActions>
				<ReflectionAction>
					<TurndownButton
						fullWidth
						size='Large'
						variant='Outline'
						disabled={disabled || saving || !changed}
						loading={saving}
						onPress={() => void save(false)}
					>
						Save draft
					</TurndownButton>
				</ReflectionAction>
				<ReflectionAction>
					<TurndownButton
						fullWidth
						size='Large'
						disabled={disabled || saving || isComplete}
						loading={saving}
						onPress={() => void save(true)}
					>
						{isComplete ? 'Completed' : 'Complete'}
					</TurndownButton>
				</ReflectionAction>
			</ReflectionActions>
		</>
	);
};

export const ReflectionScreen = () => {
	const headerHeight = useHeaderHeight();
	const params = useLocalSearchParams();
	const route = parsePracticeRoute(
		params['journeyId'],
		params['dayNumber'],
		FoundationalPracticeId.Reflect,
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
			keyboardEnabled
			testID='reflection-screen'
		>
			<ReflectionColumn style={{ paddingTop: headerHeight }}>
				{!route && (
					<Typography>This practice link isn’t available.</Typography>
				)}
				{route && loading && !session && (
					<Typography>Loading your reflection…</Typography>
				)}
				{error && (
					<Card>
						<Typography>{error}</Typography>
						<TurndownButton
							disabled={loading || isSaving}
							onPress={() => void refresh()}
						>
							Refresh reflection
						</TurndownButton>
					</Card>
				)}
				{session && (
					<>
						<ReflectionIntro>
							<ScriptureLeaf
								source={reflectionLeaf}
								contentFit='contain'
								accessible={false}
							/>
							<Typography
								align='center'
								tone='Secondary'
							>
								REFLECT
							</Typography>
							<Typography
								align='center'
								weight='Regular'
								style={prayerTitleStyle}
							>
								Consider What God Is Teaching You
							</Typography>
						</ReflectionIntro>
						<Card variant='Muted'>
							<ReflectionRow>
								<ReflectionIcon>
									<BookIcon
										width={IconSizes.Large}
										height={IconSizes.Large}
										color={TextColors.Brand}
									/>
								</ReflectionIcon>
								<ReflectionText>
									<Typography
										weight='Semibold'
										tone='Brand'
									>
										Reflection Question
									</Typography>
									<Typography>
										{session.content.reflectionQuestion}
									</Typography>
								</ReflectionText>
							</ReflectionRow>
						</Card>
						{session.content.intentionInvitation && (
							<Card variant='Muted'>
								<ReflectionRow>
									<ReflectionIcon>
										<LeafIcon
											width={IconSizes.Large}
											height={IconSizes.Large}
											color={TextColors.Brand}
										/>
									</ReflectionIcon>
									<ReflectionText>
										<Typography
											weight='Semibold'
											tone='Brand'
										>
											An invitation for today
										</Typography>
										<Typography>
											{
												session.content
													.intentionInvitation
											}
										</Typography>
									</ReflectionText>
								</ReflectionRow>
							</Card>
						)}
						<ReflectionEditor
							key={`${session.day.userId}-${session.day.journeyId}-${session.day.dayNumber}`}
							session={session}
							disabled={loading || isSaving || !!error}
							isComplete={isComplete}
							complete={complete}
						/>
					</>
				)}
			</ReflectionColumn>
		</TurndownScrollScreen>
	);
};
