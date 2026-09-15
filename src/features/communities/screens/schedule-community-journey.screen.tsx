import { Input } from '@td/components/form/input/input.component';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { ICommunityJourneyPreview } from '@td/types/community/community-journey.types';
import type { IFormationCourseReference } from '@td/types/formation/formation-course.types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import {
	parseCommunityCalendarDate,
	parseCommunityTimeZoneId,
} from '../community-journey';
import {
	cancelCommunityJourney,
	communityJourneyReason,
	configureCommunityJourney,
	getCommunityJourneyCourseOption,
	getCommunityJourneySchedule,
	listCommunityJourneyHistory,
	reviseCommunityJourney,
	scheduleOperationId,
} from '../community-journey-schedule.service';
import { useCommunityContext } from '../use-community-context.hook';

const zoneToday = (zone: string): string => {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: zone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(new Date());
	const part = (type: string) =>
		parts.find((item) => item.type === type)?.value ?? '';
	return `${part('year')}-${part('month')}-${part('day')}`;
};
export const validateScheduleFields = (
	date: string,
	zone: string,
): string | null => {
	try {
		parseCommunityTimeZoneId(zone);
		const parsed = parseCommunityCalendarDate(date);
		if (parsed <= zoneToday(zone))
			return 'Choose a future date in the community time zone.';
		return null;
	} catch {
		return 'Enter a real date as YYYY-MM-DD and a valid IANA time zone.';
	}
};
const errorMessage = (reason: string | null): string => {
	switch (reason) {
		case 'RevisionConflict':
		case 'ScheduleExists':
		case 'ScheduleUnavailable':
			return 'The schedule changed. Review the latest schedule before trying again.';
		case 'ScheduleFrozen':
			return 'The first enrollment has frozen this schedule. Cancel it and create a new one if it is still scheduled.';
		case 'CourseUnavailable':
			return 'This course is no longer available. Refresh the course option.';
		case 'InvalidInput':
			return 'The date or time zone is no longer valid. Review both fields.';
		case 'OrganizerRequired':
		case 'CommunityClosed':
		case 'CommunityUnavailable':
			return 'Your organizer access or community status changed. Refresh this page.';
		case 'EnrollmentClosed':
			return 'The enrollment window has closed. Refresh this page.';
		default:
			return 'We could not confirm the change. Retry the same request or refresh the schedule.';
	}
};

export const ScheduleCommunityJourneyScreen = () => {
	const { communityId } = useLocalSearchParams<{ communityId?: string }>();
	const { account } = useAuth();
	return (
		<ScheduleForm
			key={`${account?.userId ?? 'signed-out'}:${communityId ?? 'missing'}`}
			userId={account?.userId ?? null}
			communityId={communityId}
		/>
	);
};

const ScheduleForm = ({
	userId,
	communityId,
}: {
	userId: string | null;
	communityId: string | undefined;
}) => {
	const router = useRouter();
	const { state: context, retry: retryContext } = useCommunityContext(
		userId,
		communityId,
	);
	const [schedule, setSchedule] = useState<ICommunityJourneyPreview | null>(
		null,
	);
	const [recent, setRecent] = useState<ICommunityJourneyPreview | null>(null);
	const [course, setCourse] = useState<IFormationCourseReference | null>(
		null,
	);
	const [date, setDate] = useState('');
	const [zone, setZone] = useState(
		() => Intl.DateTimeFormat().resolvedOptions().timeZone || '',
	);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [reviewed, setReviewed] = useState(false);
	const [editing, setEditing] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [loadError, setLoadError] = useState(false);
	const pending = useRef<{
		kind: 'Create' | 'Revise' | 'Cancel';
		operationId: string;
	} | null>(null);
	const requestSerial = useRef(0);
	const focused = useRef(false);
	const load = useCallback(async () => {
		if (!communityId || context.status !== 'Ready') return;
		const serial = ++requestSerial.current;
		setLoading(true);
		setLoadError(false);
		try {
			const [current, history, option] = await Promise.all([
				getCommunityJourneySchedule(communityId),
				listCommunityJourneyHistory(communityId),
				context.context.membership.role === 'Organizer' &&
				context.context.community.status === 'Active'
					? getCommunityJourneyCourseOption(communityId)
					: Promise.resolve({ course: null }),
			]);
			if (!focused.current || serial !== requestSerial.current) return;
			setSchedule(current.communityJourney);
			setRecent(history.communityJourneys[0] ?? null);
			setCourse(option.course);
			setEditing(false);
			setReviewed(false);
			setMessage(null);
			pending.current = null;
		} catch (error) {
			if (!focused.current || serial !== requestSerial.current) return;
			setLoadError(true);
			setMessage(errorMessage(communityJourneyReason(error)));
		} finally {
			if (focused.current && serial === requestSerial.current)
				setLoading(false);
		}
	}, [communityId, context]);
	useFocusEffect(
		useCallback(() => {
			focused.current = true;
			void load();
			return () => {
				focused.current = false;
				requestSerial.current++;
			};
		}, [load]),
	);
	const ready = context.status === 'Ready';
	const organizer =
		ready &&
		context.context.membership.role === 'Organizer' &&
		context.context.community.status === 'Active';
	const organizerAccess = useRef(organizer);
	useEffect(() => {
		organizerAccess.current = organizer;
	}, [organizer]);
	const shown = schedule ?? recent;
	const canEdit =
		organizer && schedule?.status === 'Scheduled' && schedule.canRevise;
	const formOpen = organizer && (!schedule || (editing && canEdit));
	const invalid = validateScheduleFields(date, zone);
	const save = async () => {
		if (
			!communityId ||
			!course ||
			invalid ||
			busy ||
			!reviewed ||
			!formOpen
		)
			return;
		setBusy(true);
		setMessage(null);
		const kind = schedule ? 'Revise' : 'Create';
		if (pending.current?.kind !== kind)
			pending.current = { kind, operationId: scheduleOperationId() };
		try {
			const fields = {
				communityId,
				course,
				startDate: parseCommunityCalendarDate(date),
				timeZoneId: parseCommunityTimeZoneId(zone),
				operationId: pending.current.operationId,
			};
			const result = schedule
				? await reviseCommunityJourney({
						...fields,
						communityJourneyId: schedule.communityJourneyId,
						expectedRevision: schedule.revision,
					})
				: await configureCommunityJourney(fields);
			if (!focused.current || !organizerAccess.current) return;
			if (result.communityJourney.communityId !== communityId)
				throw new Error('Unexpected schedule response.');
			setSchedule(result.communityJourney);
			setRecent(result.communityJourney);
			setEditing(false);
			setReviewed(false);
			setMessage(
				'The community schedule was confirmed. This did not enroll or start a personal journey.',
			);
			pending.current = null;
		} catch (error) {
			if (!focused.current) return;
			const reason = communityJourneyReason(error);
			if (reason) pending.current = null;
			setMessage(errorMessage(reason));
		} finally {
			if (focused.current) setBusy(false);
		}
	};
	const cancel = () => {
		if (!schedule || !organizer || busy || schedule.status !== 'Scheduled')
			return;
		Alert.alert(
			'Cancel scheduled journey?',
			'Cancellation stops this community schedule and unstarted enrollments. It does not erase or end anyone’s personal journey.',
			[
				{ text: 'Keep schedule', style: 'cancel' },
				{
					text: 'Cancel schedule',
					style: 'destructive',
					onPress: () =>
						void (async () => {
							if (!communityId || !focused.current) return;
							setBusy(true);
							if (pending.current?.kind !== 'Cancel')
								pending.current = {
									kind: 'Cancel',
									operationId: scheduleOperationId(),
								};
							try {
								const result = await cancelCommunityJourney({
									communityId,
									communityJourneyId:
										schedule.communityJourneyId,
									expectedRevision: schedule.revision,
									operationId: pending.current.operationId,
								});
								if (
									!focused.current ||
									!organizerAccess.current
								)
									return;
								if (
									result.communityJourney.status !==
									'Canceled'
								)
									throw new Error(
										'Cancellation was not confirmed.',
									);
								setSchedule(null);
								setRecent(result.communityJourney);
								setMessage(
									'The scheduled journey was canceled. Personal journeys remain available.',
								);
								pending.current = null;
							} catch (error) {
								if (!focused.current) return;
								const reason = communityJourneyReason(error);
								if (reason) pending.current = null;
								setMessage(errorMessage(reason));
							} finally {
								if (focused.current) setBusy(false);
							}
						})(),
				},
			],
		);
	};
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentPadding={Spacing.Medium}
			bottomSpacing={Spacing.Large}
			keyboardEnabled
			testID='community-schedule-screen'
		>
			<View style={{ gap: Spacing.Medium }}>
				<View accessibilityRole='header'>
					<Typography size='Display'>
						Community journey schedule
					</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					A community schedule names a shared course, date, and time
					zone. Scheduling never enrolls you or starts a personal
					journey.
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
						<TurndownButton
							variant='Outline'
							onPress={retryContext}
						>
							Try again
						</TurndownButton>
					</View>
				) : null}
				{ready && loading ? (
					<Typography>Loading schedule and course…</Typography>
				) : null}
				{ready && loadError ? (
					<TurndownButton
						variant='Outline'
						onPress={() => void load()}
					>
						Refresh schedule
					</TurndownButton>
				) : null}
				{ready && !loading && !loadError ? (
					<>
						{shown ? (
							<Card>
								<View style={{ gap: Spacing.Small }}>
									<Typography size='H2'>
										{shown.status} journey
									</Typography>
									<Typography weight='Regular'>
										Course {shown.course.courseId}, version{' '}
										{shown.course.courseVersionId}
									</Typography>
									<Typography weight='Regular'>
										Start date: {shown.startDate}
									</Typography>
									<Typography weight='Regular'>
										Community time zone: {shown.timeZoneId}
									</Typography>
									{shown.status === 'Scheduled' &&
									!shown.canRevise ? (
										<Typography
											tone='Secondary'
											weight='Regular'
										>
											The first enrollment has frozen this
											schedule. Changes require canceling
											the scheduled journey and creating a
											new one, if cancellation is still
											available.
										</Typography>
									) : null}
								</View>
							</Card>
						) : (
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								No community journey is scheduled.
							</Typography>
						)}
						{!organizer ? (
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								Only an active organizer can schedule or change
								a journey. Closed communities cannot create new
								schedules.
							</Typography>
						) : null}
						{canEdit && !editing ? (
							<TurndownButton
								variant='Outline'
								onPress={() => {
									setDate(schedule.startDate);
									setZone(schedule.timeZoneId);
									setEditing(true);
									setReviewed(false);
								}}
							>
								Edit before enrollment
							</TurndownButton>
						) : null}
						{organizer && schedule?.status === 'Scheduled' ? (
							<TurndownButton
								variant='Outline'
								tone='Error'
								disabled={busy}
								onPress={cancel}
							>
								Cancel scheduled journey
							</TurndownButton>
						) : null}
						{formOpen ? (
							<View style={{ gap: Spacing.Medium }}>
								<View accessibilityRole='header'>
									<Typography size='H2'>
										{schedule
											? 'Revise schedule'
											: 'Create schedule'}
									</Typography>
								</View>
								{course ? (
									<Typography weight='Regular'>
										Available course: {course.courseId},
										version {course.courseVersionId}. The
										server checked this published course
										option.
									</Typography>
								) : (
									<Typography
										tone='Secondary'
										weight='Regular'
									>
										No published course is currently
										available for scheduling.
									</Typography>
								)}
								<Input
									label='Start date (YYYY-MM-DD)'
									placeholder='YYYY-MM-DD'
									value={date}
									onChange={(value) => {
										setDate(value);
										setReviewed(false);
										pending.current = null;
									}}
									ignoreForm
									readOnly={busy}
									testID='schedule-start-date'
								/>
								<Input
									label='Community time zone (IANA name)'
									placeholder='e.g. America/New_York'
									value={zone}
									onChange={(value) => {
										setZone(value);
										setReviewed(false);
										pending.current = null;
									}}
									ignoreForm
									readOnly={busy}
									testID='schedule-time-zone'
								/>
								{invalid && date ? (
									<Typography
										tone='Error'
										weight='Regular'
									>
										{invalid}
									</Typography>
								) : null}
								{!reviewed ? (
									<TurndownButton
										variant='Outline'
										disabled={!course || !!invalid || busy}
										onPress={() => setReviewed(true)}
									>
										Review schedule
									</TurndownButton>
								) : (
									<Card>
										<View style={{ gap: Spacing.Small }}>
											<Typography size='H2'>
												Review before saving
											</Typography>
											<Typography weight='Regular'>
												Course {course?.courseId},
												version{' '}
												{course?.courseVersionId}
											</Typography>
											<Typography weight='Regular'>
												Start date {date} in {zone}
											</Typography>
											<Typography
												tone='Secondary'
												weight='Regular'
											>
												The backend will recheck the
												date, course, and organizer
												permission when you save. This
												does not enroll anyone.
											</Typography>
											<TurndownButton
												disabled={busy}
												loading={busy}
												onPress={() => void save()}
											>
												{schedule
													? 'Save revised schedule'
													: 'Save schedule'}
											</TurndownButton>
										</View>
									</Card>
								)}
							</View>
						) : null}
					</>
				) : null}
				{message ? (
					<View
						accessibilityLiveRegion='polite'
						accessibilityRole='alert'
					>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							{message}
						</Typography>
					</View>
				) : null}
				{ready && message && !loadError ? (
					<TurndownButton
						variant='Outline'
						disabled={busy}
						onPress={() => void load()}
					>
						Refresh schedule
					</TurndownButton>
				) : null}
				<TurndownButton
					variant='Outline'
					onPress={() =>
						communityId
							? router.replace({
									pathname: '/communities/[communityId]',
									params: { communityId },
								})
							: router.replace('/communities')
					}
				>
					Community home
				</TurndownButton>
			</View>
		</TurndownScrollScreen>
	);
};
