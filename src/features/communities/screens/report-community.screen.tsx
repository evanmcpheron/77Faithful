import { Input } from '@td/components/form/input/input.component';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import {
	CommunityReportReason,
	type IReportCommunityContentRequest,
	type TCommunityReportReason,
	type TCommunityReportTarget,
} from '@td/types/community/community-moderation.types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { CommunitySafetyLimits } from '../community-safety';
import {
	createCommunitySafetyOperationId,
	getCommunitySafetyReason,
	reportCommunityContent,
} from '../community-safety.service';
import { useCommunityContext } from '../use-community-context.hook';

const reasonLabels: Record<TCommunityReportReason, string> = {
	Harassment: 'Harassment',
	CoerciveReligiousPressure: 'Coercive religious pressure',
	FinancialSolicitation: 'Financial solicitation',
	PrivacyViolation: 'Privacy violation',
	UnsafeMedicalClaims: 'Unsafe medical claims',
	AbuseOfSpiritualAuthority: 'Abuse of spiritual authority',
	Other: 'Other concern',
};
const validId = (value: string | undefined): value is string =>
	typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);

const reportTarget = (params: {
	targetType?: string;
	postId?: string;
	replyId?: string;
	memberUserId?: string;
}): TCommunityReportTarget | null => {
	switch (params.targetType) {
		case 'Post':
			return validId(params.postId)
				? { targetType: 'Post', postId: params.postId }
				: null;
		case 'Reply':
			return validId(params.postId) && validId(params.replyId)
				? {
						targetType: 'Reply',
						postId: params.postId,
						replyId: params.replyId,
					}
				: null;
		case 'Member':
			return validId(params.memberUserId)
				? { targetType: 'Member', userId: params.memberUserId }
				: null;
		case 'Community':
			return { targetType: 'Community' };
		default:
			return null;
	}
};

const ReportCommunityContent = ({
	userId,
	communityId,
	target,
}: {
	userId: string | null;
	communityId: string | undefined;
	target: TCommunityReportTarget | null;
}) => {
	const router = useRouter();
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const context = useCommunityContext(userId, communityId);
	const [reason, setReason] = useState<TCommunityReportReason | null>(null);
	const [explanation, setExplanation] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [receipt, setReceipt] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const generation = useRef(0);
	const busy = useRef(false);
	const pending = useRef<IReportCommunityContentRequest | null>(null);
	useFocusEffect(
		useCallback(() => {
			generation.current += 1;
			return () => {
				generation.current += 1;
				busy.current = false;
			};
		}, []),
	);
	const cancel = () =>
		router.canGoBack() ? router.back() : router.replace('/communities');
	const changeReason = (next: TCommunityReportReason) => {
		pending.current = null;
		setReceipt(null);
		setReason(next);
		setMessage(null);
	};
	const changeExplanation = (next: string) => {
		pending.current = null;
		setReceipt(null);
		setExplanation(next);
		setMessage(null);
	};
	const submit = async () => {
		if (
			busy.current ||
			!communityId ||
			!target ||
			!reason ||
			!userId ||
			context.state.status !== 'Ready'
		)
			return;
		setSubmitted(true);
		if (explanation.trim().length > CommunitySafetyLimits.explanation)
			return;
		pending.current ??= {
			communityId,
			target,
			reason,
			...(explanation.trim() ? { explanation: explanation.trim() } : {}),
			operationId: createCommunitySafetyOperationId(),
		};
		busy.current = true;
		setSubmitting(true);
		setMessage(null);
		const currentGeneration = generation.current;
		try {
			const result = await reportCommunityContent(pending.current);
			if (currentGeneration !== generation.current) return;
			pending.current = null;
			setReceipt(result.reportId);
			setExplanation('');
		} catch (error: unknown) {
			if (currentGeneration !== generation.current) return;
			const errorReason = getCommunitySafetyReason(error);
			if (errorReason) pending.current = null;
			if (errorReason === 'TargetUnavailable')
				setMessage(
					'This target is no longer available. No report was submitted.',
				);
			else if (
				errorReason === 'AccountUnavailable' ||
				errorReason === 'CommunityUnavailable'
			) {
				setMessage(
					'Your access changed. Check your account or community and try again.',
				);
				context.retry();
			} else if (errorReason === 'SafetyConfigurationUnavailable')
				setMessage(
					'Reporting is temporarily unavailable. No report was confirmed.',
				);
			else if (errorReason === 'RateLimited')
				setMessage(
					'Too many reports were submitted recently. Please try later.',
				);
			else
				setMessage(
					errorReason
						? 'We couldn’t submit this report. Review it and try again.'
						: 'We couldn’t confirm this report. Retry to confirm the same request.',
				);
		} finally {
			if (currentGeneration === generation.current) {
				busy.current = false;
				setSubmitting(false);
			}
		}
	};
	const ready = Boolean(
		userId &&
		validId(communityId) &&
		target &&
		context.state.status === 'Ready',
	);
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
			testID='community-report-screen'
		>
			<View style={{ paddingTop: headerHeight, gap: Spacing.Medium }}>
				<View accessibilityRole='header'>
					<Typography size='H1'>
						Report {target?.targetType?.toLowerCase() ?? 'concern'}
					</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Reports go to a separate safety review process, not
					automatically to the community organizer. This is not an
					emergency or crisis monitoring service. Your explanation is
					private to authorized safety reviewers.
				</Typography>
				{context.state.status === 'Loading' ? (
					<Typography>Checking community access…</Typography>
				) : null}
				{!ready && context.state.status !== 'Loading' ? (
					<>
						<Typography>
							This report form is unavailable. Your membership or
							the target may have changed.
						</Typography>
						<TurndownButton
							variant='Outline'
							onPress={context.retry}
						>
							Try again
						</TurndownButton>
					</>
				) : null}
				{ready && !receipt ? (
					<>
						<Typography size='H2'>Reason</Typography>
						{Object.values(CommunityReportReason).map((value) => (
							<TurndownButton
								key={value}
								variant={reason === value ? 'Solid' : 'Outline'}
								accessibilityLabel={`${reasonLabels[value]}${reason === value ? ', selected' : ''}`}
								onPress={() => changeReason(value)}
								testID={`report-reason-${value}`}
							>
								{reasonLabels[value]}
							</TurndownButton>
						))}
						{submitted && !reason ? (
							<Typography tone='Error'>
								Choose a reason before submitting.
							</Typography>
						) : null}
						<Input
							label='Optional explanation for safety reviewers'
							value={explanation}
							onChange={changeExplanation}
							multiline
							ignoreForm
							{...(submitted &&
							explanation.trim().length >
								CommunitySafetyLimits.explanation
								? {
										errorMessage:
											'Use 1,000 characters or fewer.',
									}
								: {})}
							testID='report-explanation'
						/>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							{explanation.length} /{' '}
							{CommunitySafetyLimits.explanation}
						</Typography>
						{message ? (
							<View accessibilityLiveRegion='polite'>
								<Typography tone='Error'>{message}</Typography>
							</View>
						) : null}
						<TurndownButton
							disabled={submitting || !reason}
							loading={submitting}
							onPress={() => void submit()}
							testID='submit-report'
						>
							Submit report
						</TurndownButton>
					</>
				) : null}
				{receipt ? (
					<View accessibilityLiveRegion='polite'>
						<Typography size='H2'>Report submitted</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							Receipt: {receipt}. The safety review process
							received your report. No outcome has been decided.
						</Typography>
					</View>
				) : null}
				<TurndownButton
					variant='Outline'
					disabled={submitting}
					onPress={cancel}
				>
					{receipt ? 'Done' : 'Cancel'}
				</TurndownButton>
			</View>
		</TurndownScrollScreen>
	);
};

export const ReportCommunityScreen = () => {
	const params = useLocalSearchParams<{
		communityId?: string;
		targetType?: string;
		postId?: string;
		replyId?: string;
		memberUserId?: string;
	}>();
	const { account } = useAuth();
	const userId = account?.userId ?? null;
	return (
		<ReportCommunityContent
			key={`${userId ?? 'signed-out'}:${params.communityId ?? ''}:${params.targetType ?? ''}:${params.postId ?? ''}:${params.replyId ?? ''}:${params.memberUserId ?? ''}`}
			userId={userId}
			communityId={params.communityId}
			target={reportTarget(params)}
		/>
	);
};
