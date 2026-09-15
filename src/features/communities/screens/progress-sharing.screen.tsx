import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { ICommunityJourneyPreview } from '@td/types/community/community-journey.types';
import type {
	IGetCommunityProgressSharingResult,
	ISetCommunityProgressSharingRequest,
} from '@td/types/community/community-progress.types';
import type { ICommunitySummary } from '@td/types/community/community.types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { getOwnCommunityJourneyEnrollment } from '../community-journey-detail.service';
import {
	getCommunityJourneySchedule,
	listCommunityJourneyHistory,
} from '../community-journey-schedule.service';
import {
	getProgressSharing,
	progressOperationId,
	progressReason,
	setProgressSharing,
} from '../community-progress.service';
import { listCommunities } from '../community-reader.service';
import { useCommunityContext } from '../use-community-context.hook';

const permissionReasons = new Set([
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'AccountUnavailable',
	'CommunityUnavailable',
	'CommunityClosed',
	'JourneyUnavailable',
]);

const SharingControls = ({
	userId,
	communityId,
	requestedJourneyId,
}: {
	userId: string;
	communityId: string;
	requestedJourneyId?: string;
}) => {
	const { state: context, retry: retryContext } = useCommunityContext(
		userId,
		communityId,
	);
	const [schedule, setSchedule] = useState<ICommunityJourneyPreview | null>(
		null,
	);
	const [preference, setPreference] =
		useState<IGetCommunityProgressSharingResult | null>(null);
	const [canChange, setCanChange] = useState(false);
	const [status, setStatus] = useState<
		'Loading' | 'Ready' | 'Error' | 'Unavailable' | 'NoJourney'
	>('Loading');
	const [busy, setBusy] = useState(false);
	const [uncertain, setUncertain] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [attempt, setAttempt] = useState(0);
	const generation = useRef(0);
	const pending = useRef<ISetCommunityProgressSharingRequest | null>(null);
	const ready =
		context.status === 'Ready' &&
		context.context.community.status === 'Active' &&
		context.context.membership.userId === userId;
	useFocusEffect(
		useCallback(() => {
			void attempt;
			const request = ++generation.current;
			setSchedule(null);
			setPreference(null);
			setCanChange(false);
			setStatus('Loading');
			setBusy(false);
			setUncertain(Boolean(pending.current));
			if (!ready) {
				setStatus(
					context.status === 'Loading' ? 'Loading' : 'Unavailable',
				);
				return () => {
					generation.current++;
				};
			}
			void (async () => {
				try {
					const value =
						await getCommunityJourneySchedule(communityId);
					if (generation.current !== request) return;
					const journey =
						!requestedJourneyId ||
						value.communityJourney?.communityJourneyId ===
							requestedJourneyId
							? value.communityJourney
							: ((
									await listCommunityJourneyHistory(
										communityId,
									)
								).communityJourneys.find(
									(item) =>
										item.communityJourneyId ===
										requestedJourneyId,
								) ?? null);
					if (
						!journey ||
						journey.status === 'Canceled' ||
						(requestedJourneyId &&
							journey.communityJourneyId !== requestedJourneyId)
					) {
						setStatus('NoJourney');
						return;
					}
					if (journey.communityId !== communityId)
						throw new Error('Unexpected journey.');
					const own = await getOwnCommunityJourneyEnrollment(
						communityId,
						journey.communityJourneyId,
					);
					if (generation.current !== request) return;
					if (
						own.enrollment &&
						(own.enrollment.communityId !== communityId ||
							own.enrollment.communityJourneyId !==
								journey.communityJourneyId)
					)
						throw new Error('Unexpected enrollment.');
					setCanChange(
						own.enrollment?.lifecycle.status === 'Enrolled' ||
							own.enrollment?.lifecycle.status === 'Started',
					);
					const sharing = await getProgressSharing(
						communityId,
						journey.communityJourneyId,
					);
					if (generation.current !== request) return;
					if (
						sharing.communityId !== communityId ||
						sharing.communityJourneyId !==
							journey.communityJourneyId
					)
						throw new Error('Unexpected preference.');
					setSchedule(journey);
					setPreference(sharing);
					setStatus('Ready');
				} catch (error: unknown) {
					if (generation.current !== request) return;
					setStatus(
						permissionReasons.has(progressReason(error) ?? '')
							? 'Unavailable'
							: 'Error',
					);
				}
			})();
			return () => {
				generation.current++;
				setSchedule(null);
				setPreference(null);
			};
		}, [ready, context.status, communityId, requestedJourneyId, attempt]),
	);
	const change = async (field: 'individual' | 'aggregate') => {
		if (
			busy ||
			!ready ||
			!canChange ||
			status !== 'Ready' ||
			!schedule ||
			!preference
		)
			return;
		const individual = preference.individualProgress.status === 'Shared';
		const aggregate = preference.aggregateProgress.status === 'Shared';
		pending.current ??= {
			communityId,
			communityJourneyId: schedule.communityJourneyId,
			shouldShareIndividualProgress:
				field === 'individual' ? !individual : individual,
			shouldContributeToAggregateProgress:
				field === 'aggregate' ? !aggregate : aggregate,
			operationId: progressOperationId(),
		};
		const request = generation.current;
		setBusy(true);
		setMessage(null);
		try {
			const result = await setProgressSharing(pending.current);
			if (generation.current !== request) return;
			if (
				result.communityId !== communityId ||
				result.communityJourneyId !== schedule.communityJourneyId
			)
				throw new Error('Unexpected preference.');
			pending.current = null;
			setUncertain(false);
			setPreference(result);
			setMessage(
				'Your sharing choices are saved. You can change them here at any time.',
			);
		} catch (error: unknown) {
			if (generation.current !== request) return;
			const reason = progressReason(error);
			if (reason && permissionReasons.has(reason)) {
				pending.current = null;
				setUncertain(false);
				setPreference(null);
				setSchedule(null);
				setStatus('Unavailable');
				retryContext();
				setMessage(
					'Community or journey access changed. Your sharing status is no longer shown.',
				);
			} else if (reason) {
				pending.current = null;
				setUncertain(false);
				setMessage(
					'This change was not saved. Refresh your status before trying again.',
				);
				setPreference(null);
				setStatus('Error');
			} else {
				setUncertain(true);
				setMessage(
					'We could not confirm this change. Retry the same request to confirm it.',
				);
			}
		} finally {
			if (generation.current === request) setBusy(false);
		}
	};
	const communityName =
		context.status === 'Ready'
			? context.context.community.name
			: 'this community';
	return (
		<View
			style={{ gap: Spacing.Medium }}
			testID='progress-sharing-controls'
		>
			<Typography size='H2'>{communityName}</Typography>
			{status === 'Loading' ? (
				<Typography>Loading your sharing choices…</Typography>
			) : null}
			{status === 'Unavailable' ? (
				<Typography>
					Community access is unavailable. Sharing choices cannot be
					changed here.
				</Typography>
			) : null}
			{status === 'NoJourney' ? (
				<Typography>
					No eligible community journey is available here. There are
					no progress-sharing choices to change.
				</Typography>
			) : null}
			{status === 'Error' ? (
				<>
					<Typography>
						We could not load your sharing status. Check your
						connection and try again.
					</Typography>
					<TurndownButton
						variant='Outline'
						onPress={() => setAttempt((value) => value + 1)}
					>
						Try again
					</TurndownButton>
				</>
			) : null}
			{status === 'Ready' && schedule && preference ? (
				<>
					{!canChange ? (
						<Typography>
							You are not enrolled in this community journey.
							There are no sharing choices to change until you
							enroll.
						</Typography>
					) : null}
					<Typography weight='Regular'>
						Journey: {schedule.status} community schedule, starting{' '}
						{schedule.startDate}. Your personal journey remains
						private.
					</Typography>
					<Typography weight='Regular'>
						Sharing is optional. You can join, post, and complete
						your journey without sharing progress. Your writing,
						practice choices, daily completion, and private journey
						details stay private.
					</Typography>
					<Card>
						<View style={{ gap: Spacing.Small }}>
							<Typography size='H3'>
								Your high-level journey stage
							</Typography>
							<Typography weight='Regular'>
								If shared, active members of {communityName} may
								see your name and whether your linked journey is
								Active, Completed, or Ended early. No daily
								details are shown. Material already viewed
								cannot be recalled.
							</Typography>
							<Typography testID='individual-sharing-status'>
								Current choice:{' '}
								{preference.individualProgress.status}
							</Typography>
							{canChange ? (
								<TurndownButton
									variant='Outline'
									disabled={busy || uncertain}
									loading={busy}
									onPress={() => void change('individual')}
								>
									{preference.individualProgress.status ===
									'Private'
										? 'Share my stage'
										: 'Make my stage private'}
								</TurndownButton>
							) : null}
						</View>
					</Card>
					<Card>
						<View style={{ gap: Spacing.Small }}>
							<Typography size='H3'>
								Group summary contribution
							</Typography>
							<Typography weight='Regular'>
								If you contribute, your high-level stage may be
								counted in a protected summary for active
								members of {communityName}. Counts describe only
								contributors and may be hidden to protect
								privacy. Your name is not attached to the
								summary.
							</Typography>
							<Typography testID='aggregate-sharing-status'>
								Current choice:{' '}
								{preference.aggregateProgress.status}
							</Typography>
							{canChange ? (
								<TurndownButton
									variant='Outline'
									disabled={busy || uncertain}
									loading={busy}
									onPress={() => void change('aggregate')}
								>
									{preference.aggregateProgress.status ===
									'Private'
										? 'Contribute to summary'
										: 'Stop contributing'}
								</TurndownButton>
							) : null}
						</View>
					</Card>
				</>
			) : null}
			{message ? (
				<View
					accessibilityRole='alert'
					accessibilityLiveRegion='polite'
				>
					<Typography>{message}</Typography>
					{uncertain && !busy && status === 'Ready' ? (
						<TurndownButton
							variant='Outline'
							onPress={() => void change('individual')}
						>
							Retry same change
						</TurndownButton>
					) : null}
				</View>
			) : null}
		</View>
	);
};

const ProgressSharingContent = ({
	userId,
	communityId,
	journeyId,
}: {
	userId: string | null;
	communityId?: string;
	journeyId?: string;
}) => {
	const router = useRouter();
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const [communities, setCommunities] = useState<ICommunitySummary[]>([]);
	const [listState, setListState] = useState<'Loading' | 'Ready' | 'Error'>(
		'Loading',
	);
	const [attempt, setAttempt] = useState(0);
	useFocusEffect(
		useCallback(() => {
			void attempt;
			let active = true;
			setCommunities([]);
			setListState('Loading');
			if (!communityId && userId)
				void listCommunities().then(
					(value) => {
						if (active) {
							setCommunities(value);
							setListState('Ready');
						}
					},
					() => {
						if (active) setListState('Error');
					},
				);
			return () => {
				active = false;
				setCommunities([]);
			};
		}, [userId, communityId, attempt]),
	);
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			keyboardEnabled={false}
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			testID='progress-sharing-screen'
		>
			<View style={{ paddingTop: headerHeight, gap: Spacing.Medium }}>
				<View accessibilityRole='header'>
					<Typography size='Display'>Progress sharing</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Choose separately for each community journey. Your choices
					are private unless you explicitly change them here.
				</Typography>
				{!userId ? (
					<Typography>
						Sign in to review your sharing choices.
					</Typography>
				) : communityId ? (
					<SharingControls
						key={`${userId}:${communityId}:${journeyId ?? 'current'}`}
						userId={userId}
						communityId={communityId}
						{...(journeyId
							? { requestedJourneyId: journeyId }
							: {})}
					/>
				) : (
					<View style={{ gap: Spacing.Medium }}>
						{listState === 'Loading' ? (
							<Typography>Loading your communities…</Typography>
						) : null}
						{listState === 'Error' ? (
							<>
								<Typography>
									We could not load your communities.
								</Typography>
								<TurndownButton
									variant='Outline'
									onPress={() =>
										setAttempt((value) => value + 1)
									}
								>
									Try again
								</TurndownButton>
							</>
						) : null}
						{listState === 'Ready' && communities.length === 0 ? (
							<Typography>
								You have no communities to review.
							</Typography>
						) : null}
						{communities.map((community) => (
							<TurndownButton
								key={community.communityId}
								variant='Outline'
								onPress={() =>
									router.push({
										pathname: '/settings/progress-sharing',
										params: {
											communityId: community.communityId,
										},
									})
								}
							>
								Review {community.name}
							</TurndownButton>
						))}
					</View>
				)}
			</View>
		</TurndownScrollScreen>
	);
};

export const ProgressSharingScreen = () => {
	const { communityId, communityJourneyId } = useLocalSearchParams<{
		communityId?: string;
		communityJourneyId?: string;
	}>();
	const { account } = useAuth();
	return (
		<ProgressSharingContent
			key={`${account?.userId ?? 'signed-out'}:${communityId ?? 'list'}:${communityJourneyId ?? 'current'}`}
			userId={account?.userId ?? null}
			{...(communityId ? { communityId } : {})}
			{...(communityJourneyId ? { journeyId: communityJourneyId } : {})}
		/>
	);
};
