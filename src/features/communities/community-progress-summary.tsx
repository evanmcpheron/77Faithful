import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { Spacing } from '@td/theme/spacing';
import type { TCommunityAggregateProgressResult } from '@td/types/community/community-progress.types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import {
	getAggregateProgress,
	progressReason,
} from './community-progress.service';

export const CommunityProgressSummary = ({
	communityId,
	communityJourneyId,
	communityName,
	enabled,
}: {
	communityId: string;
	communityJourneyId: string;
	communityName: string;
	enabled: boolean;
}) => {
	const [result, setResult] =
		useState<TCommunityAggregateProgressResult | null>(null);
	const [state, setState] = useState<
		'Loading' | 'Ready' | 'Error' | 'Unavailable'
	>('Loading');
	const [attempt, setAttempt] = useState(0);
	useFocusEffect(
		useCallback(() => {
			void attempt;
			let active = true;
			setResult(null);
			if (!enabled) {
				setState('Unavailable');
				return () => {
					active = false;
				};
			}
			setState('Loading');
			void getAggregateProgress(communityId, communityJourneyId).then(
				(value) => {
					if (!active) return;
					if (
						value.status === 'Available' &&
						(value.progress.communityId !== communityId ||
							value.progress.communityJourneyId !==
								communityJourneyId)
					) {
						setState('Error');
						return;
					}
					setResult(value);
					setState('Ready');
				},
				(error: unknown) => {
					if (!active) return;
					setState(
						[
							'CommunityUnavailable',
							'CommunityClosed',
							'JourneyUnavailable',
							'AuthenticationRequired',
							'AccountUnavailable',
						].includes(progressReason(error) ?? '')
							? 'Unavailable'
							: 'Error',
					);
				},
			);
			return () => {
				active = false;
				setResult(null);
			};
		}, [communityId, communityJourneyId, enabled, attempt]),
	);
	if (!enabled || state === 'Unavailable') return null;
	return (
		<Card>
			<View
				style={{ gap: Spacing.Small }}
				testID='community-progress-summary'
			>
				<Typography size='H2'>
					{communityName} journey summary
				</Typography>
				{state === 'Loading' ? (
					<Typography>Loading the shared summary…</Typography>
				) : null}
				{state === 'Error' ? (
					<>
						<Typography>
							Shared summary unavailable. Check your connection
							and try again.
						</Typography>
						<TurndownButton
							variant='Outline'
							onPress={() => setAttempt((value) => value + 1)}
						>
							Try again
						</TurndownButton>
					</>
				) : null}
				{state === 'Ready' && result?.status === 'Suppressed' ? (
					<Typography weight='Regular'>
						Shared counts are hidden to protect members’ choices. No
						count is available.
					</Typography>
				) : null}
				{state === 'Ready' && result?.status === 'Available' ? (
					<>
						<Typography weight='Regular'>
							{result.progress.contributingMemberCount} members
							chose to contribute to this summary.
						</Typography>
						<Typography weight='Regular'>
							Active journeys:{' '}
							{result.progress.activeJourneyCount} · Completed
							journeys: {result.progress.completedJourneyCount} ·
							Ended early:{' '}
							{result.progress.endedEarlyJourneyCount}
						</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							These are high-level stages among contributors, not
							a measure of faithfulness.
						</Typography>
					</>
				) : null}
			</View>
		</Card>
	);
};
