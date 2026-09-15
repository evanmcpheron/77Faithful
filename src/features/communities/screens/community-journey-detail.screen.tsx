import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useJourneyAccess } from '@td/providers/journey/journey-access.provider';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { IGetCommunityJourneyEnrollmentResult } from '@td/types/community/community-function.types';
import type { ICommunityJourneyPreview } from '@td/types/community/community-journey.types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import {
	communityJourneyDetailOperationId,
	communityJourneyDetailReason,
	getOwnCommunityJourneyEnrollment,
	retryOwnCommunityJourneyActivation,
	withdrawOwnCommunityJourneyEnrollment,
} from '../community-journey-detail.service';
import {
	getCommunityJourneySchedule,
	listCommunityJourneyHistory,
} from '../community-journey-schedule.service';
import { CommunityProgressSummary } from '../community-progress-summary';
import { useCommunityContext } from '../use-community-context.hook';

const blockText: Record<string, string> = {
	ActivePersonalJourney:
		'An active personal journey already exists. Continue that journey; this schedule cannot replace it.',
	MembershipEnded:
		'Your community membership ended. Ask the organizer if you need access again.',
	CommunityJourneyCanceled:
		'This community schedule was canceled. Your personal journey remains yours.',
	CommunityClosed:
		'This community closed. Your personal journey remains yours.',
	AccountUnavailable:
		'Your account is unavailable. Check your account access and try again.',
	EmailVerificationRequired:
		'Verify your email in account settings before starting.',
	MissedStartDate:
		'The scheduled Day 1 in your starting time zone has passed. Ask the organizer about a future schedule.',
	ContentUnavailable:
		'The scheduled course or Bible text is unavailable. Contact the organizer before another schedule.',
	SetupInvalid:
		'Your saved journey setup could not be used. Review your setup before a future schedule.',
	WritingUnavailable:
		'Your private starting writing could not be transferred safely. Review your saved writing before a future schedule.',
};
export const journeyDetailStatus = (
	schedule: ICommunityJourneyPreview,
	enrollment: IGetCommunityJourneyEnrollmentResult['enrollment'],
): string => {
	if (enrollment?.lifecycle.status === 'Started')
		return 'Your personal journey started.';
	if (enrollment?.lifecycle.status === 'StartBlocked')
		return `Start blocked. ${blockText[enrollment.lifecycle.reason]}`;
	if (enrollment?.lifecycle.status === 'Withdrawn')
		return 'You withdrew from this schedule.';
	if (schedule.status === 'Canceled')
		return 'This community schedule was canceled. Personal journeys remain available.';
	if (schedule.status === 'Completed')
		return 'This community schedule is complete. Personal journeys continue independently.';
	if (enrollment?.lifecycle.status === 'Enrolled')
		return 'You are enrolled and awaiting your personal Day 1.';
	return 'You are not enrolled in this schedule.';
};

export const CommunityJourneyDetailScreen = () => {
	const { communityId, communityJourneyId } = useLocalSearchParams<{
		communityId?: string;
		communityJourneyId?: string;
	}>();
	const { account } = useAuth();
	return (
		<CommunityJourneyDetail
			key={`${account?.userId ?? 'signed-out'}:${communityId ?? 'missing'}:${communityJourneyId ?? 'current'}`}
			userId={account?.userId ?? null}
			communityId={communityId}
			communityJourneyId={communityJourneyId}
		/>
	);
};
const CommunityJourneyDetail = ({
	userId,
	communityId,
	communityJourneyId,
}: {
	userId: string | null;
	communityId: string | undefined;
	communityJourneyId: string | undefined;
}) => {
	const router = useRouter();
	const { activeJourney } = useJourneyAccess();
	const { state: context, retry: retryContext } = useCommunityContext(
		userId,
		communityId,
	);
	const [schedule, setSchedule] = useState<ICommunityJourneyPreview | null>(
		null,
	);
	const [enrollment, setEnrollment] =
		useState<IGetCommunityJourneyEnrollmentResult['enrollment']>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const focused = useRef(false);
	const serial = useRef(0);
	const pending = useRef<{
		kind: 'Withdraw' | 'Retry';
		operationId: string;
	} | null>(null);
	const ready =
		context.status === 'Ready' &&
		context.context.membership.userId === userId;
	const load = useCallback(async () => {
		if (!communityId || !ready) return;
		const request = ++serial.current;
		setLoading(true);
		setError(null);
		try {
			const current = await getCommunityJourneySchedule(communityId);
			const selected =
				current.communityJourney?.communityJourneyId ===
					communityJourneyId || !communityJourneyId
					? current.communityJourney
					: ((
							await listCommunityJourneyHistory(communityId)
						).communityJourneys.find(
							(item) =>
								item.communityJourneyId === communityJourneyId,
						) ?? null);
			if (!selected) {
				if (focused.current && serial.current === request) {
					setSchedule(null);
					setEnrollment(null);
				}
				return;
			}
			if (selected.communityId !== communityId)
				throw new Error('Unexpected schedule.');
			const own = await getOwnCommunityJourneyEnrollment(
				communityId,
				selected.communityJourneyId,
			);
			if (
				own.enrollment &&
				(own.enrollment.communityId !== communityId ||
					own.enrollment.communityJourneyId !==
						selected.communityJourneyId)
			)
				throw new Error('Unexpected enrollment.');
			if (!focused.current || serial.current !== request) return;
			setSchedule(selected);
			setEnrollment(own.enrollment);
			setMessage(null);
		} catch (cause) {
			if (!focused.current || serial.current !== request) return;
			const reason = communityJourneyDetailReason(cause);
			setSchedule(null);
			setEnrollment(null);
			setError(
				[
					'CommunityUnavailable',
					'MembershipEnded',
					'AuthenticationRequired',
					'AccountUnavailable',
					'EmailVerificationRequired',
				].includes(reason ?? '')
					? 'Community or account access changed. Return to your communities.'
					: 'We could not load your schedule status. Check your connection and refresh.',
			);
		} finally {
			if (focused.current && serial.current === request)
				setLoading(false);
		}
	}, [communityId, communityJourneyId, ready]);
	useFocusEffect(
		useCallback(() => {
			focused.current = true;
			void load();
			return () => {
				focused.current = false;
				serial.current++;
			};
		}, [load]),
	);

	const act = async (kind: 'Withdraw' | 'Retry') => {
		if (!ready || !focused.current || !communityId || !schedule || busy)
			return;
		setBusy(true);
		setMessage(null);
		if (pending.current?.kind !== kind)
			pending.current = {
				kind,
				operationId: communityJourneyDetailOperationId(),
			};
		try {
			if (kind === 'Withdraw') {
				const result = await withdrawOwnCommunityJourneyEnrollment(
					communityId,
					schedule.communityJourneyId,
					pending.current.operationId,
				);
				if (
					result.communityJourneyEnrollmentId !==
					schedule.communityJourneyId
				)
					throw new Error('Unexpected withdrawal.');
			} else
				await retryOwnCommunityJourneyActivation(
					communityId,
					schedule.communityJourneyId,
					pending.current.operationId,
				);
			if (!focused.current) return;
			pending.current = null;
			await load();
		} catch (cause) {
			if (!focused.current) return;
			const reason = communityJourneyDetailReason(cause);
			if (reason) pending.current = null;
			setMessage(
				reason === 'ActivePersonalJourney'
					? 'An active personal journey cannot be replaced from here.'
					: reason === 'MembershipEnded' ||
						  reason === 'ScheduleCanceled'
						? 'Your membership or schedule changed. Refresh this page.'
						: 'We could not confirm this action. Retry the same request or refresh your status.',
			);
		} finally {
			if (focused.current) setBusy(false);
		}
	};
	const withdraw = () =>
		Alert.alert(
			'Withdraw from this schedule?',
			'Withdrawal stops your unstarted enrollment. It does not end an existing personal journey.',
			[
				{ text: 'Keep enrollment', style: 'cancel' },
				{
					text: 'Withdraw',
					style: 'destructive',
					onPress: () => void act('Withdraw'),
				},
			],
		);
	const returnHome = () =>
		communityId
			? router.replace({
					pathname: '/communities/[communityId]',
					params: { communityId },
				})
			: router.replace('/communities');
	const canWithdraw =
		(schedule?.status === 'Scheduled' || schedule?.status === 'Active') &&
		enrollment?.lifecycle.status === 'Enrolled' &&
		enrollment.activationEligibility === 'Eligible' &&
		context.status === 'Ready' &&
		context.context.community.status === 'Active';
	const canRetry =
		enrollment?.lifecycle.status === 'Enrolled' &&
		enrollment.activationEligibility === 'Eligible' &&
		enrollment.startingZoneCalendarDate ===
			enrollment.groupDisplayStartDate &&
		(schedule?.status === 'Scheduled' || schedule?.status === 'Active');
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentPadding={Spacing.Medium}
			bottomSpacing={Spacing.Large}
			keyboardEnabled={false}
			testID='community-journey-detail-screen'
		>
			<View style={{ gap: Spacing.Medium }}>
				<View accessibilityRole='header'>
					<Typography size='Display'>Community journey</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					The group schedule follows the community time zone. Your
					personal days follow your existing phone calendar behavior.
					Joining never shares your writing, practice choices, or
					completion.
				</Typography>
				{!ready ? (
					<View accessibilityLiveRegion='polite'>
						<Typography>
							{context.status === 'Loading'
								? 'Loading community…'
								: context.status === 'Unavailable'
									? 'Community access is unavailable.'
									: 'We could not load this community.'}
						</Typography>
						{context.status === 'Error' ? (
							<TurndownButton
								variant='Outline'
								onPress={retryContext}
							>
								Try again
							</TurndownButton>
						) : null}
					</View>
				) : null}
				{ready && loading ? (
					<Typography>Loading your schedule status…</Typography>
				) : null}
				{ready && error ? (
					<View accessibilityRole='alert'>
						<Typography>{error}</Typography>
						<TurndownButton
							variant='Outline'
							onPress={() => void load()}
						>
							Refresh status
						</TurndownButton>
					</View>
				) : null}
				{ready && !loading && !error && !schedule ? (
					<Typography>
						No community journey is available here.
					</Typography>
				) : null}
				{ready && !loading && !error && schedule ? (
					<>
						<Card>
							<View style={{ gap: Spacing.Small }}>
								<Typography size='H2'>
									{schedule.status} schedule
								</Typography>
								<Typography weight='Regular'>
									Course {schedule.course.courseId}, version{' '}
									{schedule.course.courseVersionId}
								</Typography>
								<Typography weight='Regular'>
									Start date: {schedule.startDate}
								</Typography>
								<Typography weight='Regular'>
									Community time zone: {schedule.timeZoneId}
								</Typography>
							</View>
						</Card>
						<Card>
							<View style={{ gap: Spacing.Small }}>
								<Typography size='H2'>Your status</Typography>
								<Typography weight='Regular'>
									{journeyDetailStatus(schedule, enrollment)}
								</Typography>
								{enrollment?.lifecycle.status === 'Enrolled' &&
								enrollment.activationEligibility ===
									'ActivePersonalJourney' ? (
									<Typography weight='Regular'>
										An active personal journey already
										exists. This schedule will not replace
										it.
									</Typography>
								) : null}
							</View>
						</Card>
						{context.status === 'Ready' &&
						context.context.community.status === 'Active' &&
						schedule.status !== 'Canceled' ? (
							<>
								<CommunityProgressSummary
									key={`${userId}:${communityId}:${schedule.communityJourneyId}`}
									communityId={communityId!}
									communityJourneyId={
										schedule.communityJourneyId
									}
									communityName={
										context.context.community.name
									}
									enabled={true}
								/>
								<TurndownButton
									variant='Outline'
									onPress={() =>
										router.push({
											pathname:
												'/settings/progress-sharing',
											params: {
												communityId: communityId!,
												communityJourneyId:
													schedule.communityJourneyId,
											},
										})
									}
								>
									Review progress sharing
								</TurndownButton>
							</>
						) : null}
						{schedule.canEnroll &&
						!enrollment &&
						context.status === 'Ready' &&
						context.context.membership.role === 'Member' ? (
							<TurndownButton
								onPress={() =>
									router.push({
										pathname:
											'/communities/[communityId]/journeys/[communityJourneyId]/enroll',
										params: {
											communityId: communityId!,
											communityJourneyId:
												schedule.communityJourneyId,
										},
									})
								}
							>
								Review enrollment
							</TurndownButton>
						) : null}
						{canWithdraw ? (
							<TurndownButton
								variant='Outline'
								tone='Error'
								disabled={busy}
								onPress={withdraw}
							>
								Withdraw before start
							</TurndownButton>
						) : null}
						{canRetry ? (
							<TurndownButton
								variant='Outline'
								disabled={busy}
								loading={busy}
								onPress={() => void act('Retry')}
							>
								Retry Day 1 activation
							</TurndownButton>
						) : null}
						{enrollment?.lifecycle.status === 'Started' &&
						activeJourney?.journeyId ===
							enrollment.lifecycle.journeyId ? (
							<TurndownButton
								onPress={() => router.push('/journey')}
							>
								Open your personal journey
							</TurndownButton>
						) : null}
						<TurndownButton
							variant='Outline'
							disabled={busy}
							onPress={() => void load()}
						>
							Refresh status
						</TurndownButton>
					</>
				) : null}
				{message ? (
					<View
						accessibilityRole='alert'
						accessibilityLiveRegion='polite'
					>
						<Typography>{message}</Typography>
					</View>
				) : null}
				<TurndownButton
					variant='Outline'
					onPress={returnHome}
				>
					Community home
				</TurndownButton>
			</View>
		</TurndownScrollScreen>
	);
};
