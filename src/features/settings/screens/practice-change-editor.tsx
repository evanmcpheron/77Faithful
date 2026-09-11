import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { setupPractices } from '@td/features/journey-setup/journey-setup-content';
import { SetupPracticeChoice } from '@td/features/journey-setup/setup-practice-choice.component';
import type {
	TOptionalPracticeId,
	TOptionalPracticeSelection,
} from '@td/types/formation/practice.types';
import { useState } from 'react';
import { View } from 'react-native';
import type { TPracticeSettingsResult } from '../practice-settings.types';
import type { usePracticeSettings } from '../use-practice-settings.hook';
import { accountStyles as styles } from './account.styles';

const practiceNames = (ids: readonly TOptionalPracticeId[]) =>
	setupPractices
		.filter((practice) => ids.includes(practice.practiceId))
		.map((practice) => practice.name)
		.join(' · ');
const displayDate = (date: string) =>
	new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(`${date}T12:00:00Z`));
const selectionTuple = (
	ids: readonly TOptionalPracticeId[],
): TOptionalPracticeSelection | null => {
	if (ids.length === 4) return [ids[0]!, ids[1]!, ids[2]!, ids[3]!];
	if (ids.length === 3) return [ids[0]!, ids[1]!, ids[2]!];
	if (ids.length === 2) return [ids[0]!, ids[1]!];
	return null;
};

export const PracticeChangeEditor = ({
	data,
	settings,
}: {
	data: Extract<TPracticeSettingsResult, { status: 'Ready' }>;
	settings: ReturnType<typeof usePracticeSettings>;
}) => {
	const { selection, nextDay } = data;
	const pending = selection.pendingChange;
	const initialIds =
		pending?.optionalPracticeIds ?? selection.currentOptionalPracticeIds;
	const [selected, setSelected] =
		useState<readonly TOptionalPracticeId[]>(initialIds);
	const [editing, setEditing] = useState(false);
	const [reviewing, setReviewing] = useState(false);
	const [canceling, setCanceling] = useState(false);
	const proposed = selectionTuple(selected);
	const unchanged =
		initialIds.length === selected.length &&
		initialIds.every((id) => selected.includes(id));
	const locked =
		settings.isSaving ||
		settings.hasUnconfirmedChange ||
		settings.needsReview ||
		!!settings.error;
	return (
		<View style={styles.section}>
			{pending && (
				<Card variant='Muted'>
					<View style={styles.section}>
						<View accessibilityRole='header'>
							<Typography size='H3'>
								Upcoming practices
							</Typography>
						</View>
						<Typography weight='Regular'>
							{practiceNames(pending.optionalPracticeIds)}
						</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							Begins Day {pending.effectiveDayNumber} ·{' '}
							{displayDate(pending.effectiveDate)}
						</Typography>
						{canceling ? (
							<>
								<Typography weight='Regular'>
									Cancel this upcoming change? Your current
									practices will continue.
								</Typography>
								<TurndownButton
									disabled={locked}
									loading={settings.isSaving}
									onPress={() => void settings.cancel()}
								>
									Confirm cancellation
								</TurndownButton>
								<TurndownButton
									variant='Ghost'
									disabled={locked}
									onPress={() => setCanceling(false)}
								>
									Keep upcoming change
								</TurndownButton>
							</>
						) : (
							<TurndownButton
								variant='Outline'
								disabled={locked || editing}
								onPress={() => setCanceling(true)}
							>
								Cancel upcoming change
							</TurndownButton>
						)}
					</View>
				</Card>
			)}
			{!editing && nextDay && (
				<TurndownButton
					disabled={locked || canceling}
					onPress={() => setEditing(true)}
				>
					{pending
						? 'Revise upcoming practices'
						: 'Change Chosen Practices'}
				</TurndownButton>
			)}
			{!nextDay && (
				<Typography
					size='Body2'
					tone='Secondary'
					weight='Regular'
				>
					{data.dayNumber === 77
						? 'You’re on Day 77. There are no remaining days for a practice change.'
						: 'The next journey day has already been reached on your account. Its assigned practices stay the same.'}
				</Typography>
			)}
			{editing && nextDay && (
				<>
					<View accessibilityRole='header'>
						<Typography size='H2'>
							{reviewing
								? 'Review your change'
								: 'Choose your practices'}
						</Typography>
					</View>
					<Typography
						tone='Secondary'
						weight='Regular'
					>
						Changes begin on the next journey day. Today and earlier
						days keep their assigned practices and completion
						records.
					</Typography>
					{reviewing ? (
						<Card>
							<View style={styles.section}>
								<Typography weight='Semibold'>
									Current practices
								</Typography>
								<Typography weight='Regular'>
									{practiceNames(
										selection.currentOptionalPracticeIds,
									)}
								</Typography>
								<Typography weight='Semibold'>
									New practices
								</Typography>
								<Typography weight='Regular'>
									{practiceNames(selected)}
								</Typography>
								<Typography weight='Semibold'>
									Begins Day {nextDay.dayNumber} ·{' '}
									{displayDate(nextDay.calendarDate)}
								</Typography>
								<Typography
									size='Body2'
									tone='Secondary'
									weight='Regular'
								>
									Read Scripture, Pray, and Reflect remain
									part of every day. You can revise or cancel
									this change before it takes effect.
								</Typography>
								<TurndownButton
									disabled={locked || !proposed}
									loading={settings.isSaving}
									onPress={() => {
										if (proposed)
											void settings.confirm(proposed);
									}}
								>
									Confirm practice change
								</TurndownButton>
								<TurndownButton
									variant='Outline'
									disabled={locked}
									onPress={() => setReviewing(false)}
								>
									Edit choices
								</TurndownButton>
							</View>
						</Card>
					) : (
						<>
							<View accessibilityLiveRegion='polite'>
								<Typography weight='Semibold'>
									{selected.length} selected · Choose 2–4
								</Typography>
							</View>
							{setupPractices.map((practice) => {
								const checked = selected.includes(
									practice.practiceId,
								);
								return (
									<SetupPracticeChoice
										key={practice.practiceId}
										practice={practice}
										checked={checked}
										disabled={
											locked ||
											(!checked && selected.length >= 4)
										}
										onChange={(isChecked) => {
											if (locked) return;
											setSelected((previous) => {
												if (!isChecked)
													return previous.filter(
														(id) =>
															id !==
															practice.practiceId,
													);
												return previous.includes(
													practice.practiceId,
												) || previous.length >= 4
													? previous
													: [
															...previous,
															practice.practiceId,
														];
											});
										}}
									/>
								);
							})}
							<TurndownButton
								disabled={locked || !proposed || unchanged}
								onPress={() => setReviewing(true)}
							>
								Review change
							</TurndownButton>
						</>
					)}
					<TurndownButton
						variant='Ghost'
						disabled={locked}
						onPress={() => {
							setEditing(false);
							setReviewing(false);
							setSelected(initialIds);
						}}
					>
						Discard edits
					</TurndownButton>
				</>
			)}
		</View>
	);
};

export const PracticeChangeFeedback = ({
	settings,
}: {
	settings: ReturnType<typeof usePracticeSettings>;
}) => (
	<View style={styles.section}>
		{settings.mutationError && (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
			>
				<Typography
					tone='Error'
					weight='Regular'
				>
					{settings.mutationError}
				</Typography>
				{settings.hasUnconfirmedChange && (
					<TurndownButton
						variant='Outline'
						loading={settings.isSaving}
						disabled={settings.isSaving}
						onPress={() => void settings.retry()}
					>
						Retry this change
					</TurndownButton>
				)}
				{settings.needsReview && (
					<TurndownButton
						variant='Outline'
						onPress={() => void settings.refresh()}
					>
						Reload Practices
					</TurndownButton>
				)}
			</View>
		)}
		{settings.notice && (
			<View accessibilityLiveRegion='polite'>
				<Typography tone='Secondary'>{settings.notice}</Typography>
			</View>
		)}
	</View>
);
