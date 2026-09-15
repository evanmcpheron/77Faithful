import { Input } from '@td/components/form/input/input.component';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type {
	IGetCommunitySafetyReportResult,
	IReviewCommunityReportRequest,
	TCommunityModerationAction,
} from '@td/types/community/community-moderation.types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import {
	createReviewOperationId,
	getCommunitySafetyReport,
	reviewCommunityReport,
	safetyReviewReason,
} from '../community-safety-review-detail.service';
import {
	hasCommunitySafetyReviewerCapability,
	isSafetyReviewDenied,
} from '../community-safety-review.service';

const validId = (value: string | null): value is string =>
	typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);

export const permittedReviewActions = (
	detail: IGetCommunitySafetyReportResult,
	reviewerId: string,
): TCommunityModerationAction[] => {
	const { report, currentTarget } = detail;
	if (
		report.review.status === 'Resolved' ||
		(report.review.status === 'UnderReview' &&
			report.review.reviewerUserId !== reviewerId)
	)
		return [];
	const actions: TCommunityModerationAction[] = [];
	if (
		(report.target.targetType === 'Post' ||
			report.target.targetType === 'Reply') &&
		currentTarget.status === 'Published'
	)
		actions.push('RemoveContent');
	if (
		report.target.targetType === 'Member' &&
		currentTarget.status === 'Active' &&
		currentTarget.role === 'Member'
	)
		actions.push('RemoveMember');
	if (
		report.target.targetType === 'Community' &&
		currentTarget.status === 'Active'
	)
		actions.push('CloseCommunity');
	if (report.target.targetType !== 'Message') actions.push('NoAction');
	return actions;
};

const actionLabels: Record<TCommunityModerationAction, string> = {
	RemoveContent: 'Remove content',
	RemoveMember: 'Remove member',
	CloseCommunity: 'Close community',
	NoAction: 'No action',
};
const consequence: Record<TCommunityModerationAction, string> = {
	RemoveContent:
		'The published post or reply will become a text-free removal notice for members.',
	RemoveMember:
		'This member will lose community access. Their private writing and journey remain private.',
	CloseCommunity:
		'The community will close for everyone and its active invitation will be revoked. This cannot be undone.',
	NoAction: 'The report will close without changing the target.',
};

export const ReviewContent = ({
	userId,
	reportId,
}: {
	userId: string | null;
	reportId: string | null;
}) => {
	const router = useRouter();
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const [detail, setDetail] =
		useState<IGetCommunitySafetyReportResult | null>(null);
	const [state, setState] = useState<
		'Loading' | 'Ready' | 'Error' | 'Unavailable'
	>('Loading');
	const [message, setMessage] = useState<string | null>(null);
	const [action, setAction] = useState<TCommunityModerationAction | null>(
		null,
	);
	const [explanation, setExplanation] = useState('');
	const [busy, setBusy] = useState(false);
	const generation = useRef(0);
	const busyRef = useRef(false);
	const pending = useRef<IReviewCommunityReportRequest | null>(null);
	const safeRoute = useCallback(() => router.replace('/settings'), [router]);
	const load = useCallback(async () => {
		const currentGeneration = ++generation.current;
		setDetail(null);
		setAction(null);
		setExplanation('');
		pending.current = null;
		setState('Loading');
		setMessage(null);
		if (!userId || !validId(reportId)) {
			safeRoute();
			return;
		}
		try {
			if (!(await hasCommunitySafetyReviewerCapability(userId))) {
				if (generation.current === currentGeneration) safeRoute();
				return;
			}
			const result = await getCommunitySafetyReport({ reportId });
			if (generation.current !== currentGeneration) return;
			setDetail(result);
			setState('Ready');
		} catch (error: unknown) {
			if (generation.current !== currentGeneration) return;
			const reason = safetyReviewReason(error);
			if (isSafetyReviewDenied(error)) {
				safeRoute();
				return;
			}
			setState(
				reason === 'ReviewerConflict' ||
					reason === 'ReportUnavailable' ||
					reason === 'TargetUnavailable' ||
					reason === 'UnsupportedTarget'
					? 'Unavailable'
					: 'Error',
			);
			setMessage(
				reason === 'ReviewerConflict'
					? 'Independent review is required. You cannot review a report you filed or one about you.'
					: reason === 'UnsupportedTarget'
						? 'This target has no supported review operation.'
						: reason === 'ReportUnavailable' ||
							  reason === 'TargetUnavailable'
							? 'This report or target is unavailable.'
							: 'Could not load this report. Try again.',
			);
		}
	}, [userId, reportId, safeRoute]);
	useFocusEffect(
		useCallback(() => {
			void load();
			return () => {
				generation.current += 1;
				busyRef.current = false;
				pending.current = null;
				setDetail(null);
			};
		}, [load]),
	);
	const selectAction = (next: TCommunityModerationAction) => {
		pending.current = null;
		setAction(next);
		setMessage(null);
	};
	const changeExplanation = (text: string) => {
		pending.current = null;
		setExplanation(text);
		setMessage(null);
	};
	const submit = async () => {
		if (!detail || !userId || !action || busyRef.current) return;
		const trimmed = explanation.trim();
		if (
			!trimmed ||
			trimmed.length > 1000 ||
			/[\x00-\x1f\x7f]/.test(trimmed)
		) {
			setMessage(
				'Give a brief explanation for the restricted review record (1–1,000 characters, no control characters).',
			);
			return;
		}
		pending.current ??= {
			reportId: detail.reportId,
			expectedRevision: detail.report.revision,
			expectedTargetRevision: detail.currentTarget.revision,
			...(detail.currentTarget.revision !==
				detail.report.evidence.targetRevision &&
			detail.currentTarget.textDigest
				? { reviewedCurrentTextDigest: detail.currentTarget.textDigest }
				: {}),
			requestedAction: action,
			explanation: trimmed,
			operationId: createReviewOperationId(),
		};
		busyRef.current = true;
		setBusy(true);
		setMessage(null);
		const currentGeneration = generation.current;
		try {
			if (!(await hasCommunitySafetyReviewerCapability(userId))) {
				if (generation.current === currentGeneration) {
					setDetail(null);
					safeRoute();
				}
				return;
			}
			if (generation.current !== currentGeneration) return;
			await reviewCommunityReport(pending.current);
			if (generation.current !== currentGeneration) return;
			pending.current = null;
			await load();
			if (
				generation.current === currentGeneration + 1 &&
				state !== 'Error'
			)
				setMessage(
					'Decision recorded. The queue will refresh when you return.',
				);
		} catch (error: unknown) {
			if (generation.current !== currentGeneration) return;
			const reason = safetyReviewReason(error);
			if (isSafetyReviewDenied(error)) {
				setDetail(null);
				safeRoute();
				return;
			}
			if (
				reason === 'RevisionConflict' ||
				reason === 'CurrentContentReviewRequired' ||
				reason === 'TargetUnavailable' ||
				reason === 'CommunityClosed'
			) {
				pending.current = null;
				await load();
				if (generation.current === currentGeneration + 1)
					setMessage(
						'The report or target changed. Review the latest state and choose again. No decision was recorded.',
					);
			} else {
				if (reason) pending.current = null;
				setMessage(
					reason === 'ReviewerConflict'
						? 'Independent review is required for this case.'
						: reason === 'OrganizerEscalationRequired'
							? 'Removing an organizer requires an independent escalation operation that is not configured here.'
							: reason === 'ReviewerRequired'
								? 'Your reviewer authority changed. Return to Settings.'
								: 'Could not confirm the decision. Try again to confirm the same request.',
				);
			}
		} finally {
			busyRef.current = false;
			setBusy(false);
		}
	};
	const confirm = () => {
		if (!action) return;
		const confirmationGeneration = generation.current;
		Alert.alert(
			`Confirm ${actionLabels[action].toLowerCase()}`,
			consequence[action],
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: `Confirm ${actionLabels[action].toLowerCase()}`,
					style: action === 'NoAction' ? 'default' : 'destructive',
					onPress: () => {
						if (generation.current === confirmationGeneration)
							void submit();
					},
				},
			],
		);
	};
	const actions =
		detail && userId ? permittedReviewActions(detail, userId) : [];
	const report = detail?.report;
	const current = detail?.currentTarget;
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			keyboardEnabled
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			testID='safety-review-detail-screen'
		>
			<View style={{ paddingTop: headerHeight, gap: Spacing.Medium }}>
				<View accessibilityRole='header'>
					<Typography size='H1'>Review report</Typography>
				</View>
				{state === 'Loading' ? (
					<Typography>Loading restricted report…</Typography>
				) : null}
				{state === 'Error' || state === 'Unavailable' ? (
					<>
						<Typography tone='Error'>{message}</Typography>
						{state === 'Error' ? (
							<TurndownButton
								variant='Outline'
								onPress={() => void load()}
							>
								Try again
							</TurndownButton>
						) : null}
					</>
				) : null}
				{state === 'Ready' && report && current ? (
					<>
						<Card>
							<View style={{ gap: Spacing.Small }}>
								<Typography size='H2'>
									Reported target: {report.target.targetType}
								</Typography>
								<Typography>
									Community: {report.communityId}
								</Typography>
								<Typography>
									Report revision: {report.revision} ·
									Submitted target revision:{' '}
									{report.evidence.targetRevision}
								</Typography>
								<Typography>Reason: {report.reason}</Typography>
								<Typography>
									Review status:{' '}
									{report.review.status === 'Resolved'
										? 'Resolved'
										: report.review.status === 'UnderReview'
											? 'Under review'
											: 'Submitted'}
								</Typography>
								{report.explanation ? (
									<Typography>
										Restricted report explanation:{' '}
										{report.explanation}
									</Typography>
								) : null}
								<Typography tone='Secondary'>
									This explanation is restricted to
									independent safety reviewers. It is not a
									public removal reason and is not sent to the
									organizer.
								</Typography>
							</View>
						</Card>
						<Card>
							<View style={{ gap: Spacing.Small }}>
								<Typography size='H2'>
									Evidence submitted with report
								</Typography>
								{report.evidence.text ? (
									<Typography>
										{report.evidence.text}
									</Typography>
								) : null}
								{report.evidence.targetDisplayName ? (
									<Typography>
										Reported member:{' '}
										{report.evidence.targetDisplayName}
									</Typography>
								) : null}
								{report.evidence.communityName ? (
									<Typography>
										Reported community:{' '}
										{report.evidence.communityName}
									</Typography>
								) : null}
								{report.evidence.communityPurpose ? (
									<Typography>
										Purpose at submission:{' '}
										{report.evidence.communityPurpose}
									</Typography>
								) : null}
								{!report.evidence.text &&
								!report.evidence.targetDisplayName &&
								!report.evidence.communityName ? (
									<Typography>
										No text evidence was submitted for this
										target.
									</Typography>
								) : null}
							</View>
						</Card>
						<Card>
							<View style={{ gap: Spacing.Small }}>
								<Typography size='H2'>
									Current target
								</Typography>
								<Typography>
									Status: {current.status} · Revision:{' '}
									{current.revision}
								</Typography>
								{current.text ? (
									<Typography>{current.text}</Typography>
								) : (
									<Typography tone='Secondary'>
										No current public text is available.
									</Typography>
								)}
								{current.role ? (
									<Typography>
										Current role: {current.role}
									</Typography>
								) : null}
								{current.revision !==
								report.evidence.targetRevision ? (
									<Typography tone='Error'>
										This target changed after the report.
										Review the current state before
										deciding.
									</Typography>
								) : null}
							</View>
						</Card>
						{report.review.status === 'Resolved' ? (
							<Typography>
								This report has already been resolved. No
								further decision is available.
							</Typography>
						) : report.review.status === 'UnderReview' &&
						  report.review.reviewerUserId !== userId ? (
							<Typography>
								Another reviewer holds this case. A decision is
								unavailable here.
							</Typography>
						) : actions.length === 0 ? (
							<Typography>
								No supported decision is available for this
								target.
							</Typography>
						) : (
							<>
								<Typography size='H2'>Decision</Typography>
								{actions.map((option) => (
									<TurndownButton
										key={option}
										variant={
											action === option
												? 'Solid'
												: 'Outline'
										}
										accessibilityLabel={`${actionLabels[option]}${action === option ? ', selected' : ''}`}
										onPress={() => selectAction(option)}
										testID={`review-action-${option}`}
									>
										{actionLabels[option]}
									</TurndownButton>
								))}
								{action ? (
									<>
										<Typography>
											{consequence[action]}
										</Typography>
										<Input
											label='Restricted decision explanation'
											value={explanation}
											onChange={changeExplanation}
											multiline
											ignoreForm
											testID='review-explanation'
										/>
										<Typography tone='Secondary'>
											This explanation stays in the
											restricted action record. Do not
											copy private report text into a
											public reason.
										</Typography>
										<TurndownButton
											disabled={busy}
											loading={busy}
											onPress={confirm}
											testID='confirm-review-decision'
										>
											Review and confirm
										</TurndownButton>
									</>
								) : null}
							</>
						)}
					</>
				) : null}
				{state === 'Ready' && message ? (
					<View accessibilityLiveRegion='polite'>
						<Typography tone='Error'>{message}</Typography>
					</View>
				) : null}
				<TurndownButton
					variant='Outline'
					disabled={busy}
					onPress={() =>
						router.canGoBack()
							? router.back()
							: router.replace('/safety-reports')
					}
				>
					Back to reports
				</TurndownButton>
			</View>
		</TurndownScrollScreen>
	);
};

export const CommunitySafetyReviewDetailScreen = ({
	reportId,
}: {
	reportId: string | null;
}) => {
	const { account } = useAuth();
	const userId = account?.userId ?? null;
	return (
		<ReviewContent
			key={`${userId ?? 'signed-out'}:${reportId ?? 'invalid'}`}
			userId={userId}
			reportId={reportId}
		/>
	);
};
