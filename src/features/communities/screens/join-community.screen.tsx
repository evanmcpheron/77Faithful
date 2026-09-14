import { Input } from '@td/components/form/input/input.component';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { LoadingState } from '@td/components/ui/loading-state/loading-state.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { loadAccountProfile } from '@td/features/account/account-profile.service';
import { useAuth } from '@td/providers/auth/auth.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type {
	IAcceptCommunityInvitationRequest,
	TCommunityInvitationReasonCode,
} from '@td/types/community/community-function.types';
import type { ICommunityInvitationPreview } from '@td/types/community/community-invitation.types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { normalizeCommunityInvitationCode } from '../community-invitation';
import {
	acceptCommunityInvitation,
	createCommunityInvitationOperationId,
	getCommunityInvitationReason,
	previewCommunityInvitation,
} from '../community-invitation.service';
import { joinCommunityStyles as styles } from './join-community.styles';

interface IJoinCommunityScreenProps {
	initialCode?: string;
}

interface IFormMessage {
	text: string;
	tone: 'Error' | 'Warning';
}

const formatCodeInput = (value: string): string => {
	const uppercase = value.toUpperCase().slice(0, 64);
	if (!/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]*$/.test(uppercase))
		return uppercase;
	return (
		uppercase
			.slice(0, 20)
			.match(/.{1,5}/g)
			?.join('-') ?? ''
	);
};
const invitationCodeError = (value: string): string | undefined => {
	try {
		normalizeCommunityInvitationCode(value);
		return undefined;
	} catch {
		return 'Enter the 20-character invitation code.';
	}
};

const displayNameError = (value: string): string | undefined => {
	const normalized = value.trim();
	if (!normalized) return 'Enter the public name community members will see.';
	if (normalized.length > 80) return 'Use 80 characters or fewer.';
	if (/[\u0000-\u001f\u007f]/.test(normalized))
		return 'Remove unsupported control characters.';
	return undefined;
};

const formatExpiry = ({ seconds }: { seconds: number }): string =>
	new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(seconds * 1_000));

const previewFailureMessage = (
	reason: TCommunityInvitationReasonCode | null,
): IFormMessage => {
	if (reason === 'RateLimited')
		return {
			text: 'Too many invitation checks were attempted. Wait a little, then try again.',
			tone: 'Warning',
		};
	if (reason === 'EmailVerificationRequired')
		return {
			text: 'Confirm your email before previewing this community invitation.',
			tone: 'Warning',
		};
	if (reason === 'AuthenticationRequired' || reason === 'AccountUnavailable')
		return {
			text: 'Your account is not available for this invitation. Sign in again or try later.',
			tone: 'Warning',
		};
	if (reason === 'InvitationUnavailable' || reason === 'CommunityClosed')
		return {
			text: 'This invitation is invalid, expired, revoked, or no longer available.',
			tone: 'Error',
		};
	if (reason === 'InvalidInput')
		return {
			text: 'Check the invitation code and try again.',
			tone: 'Error',
		};
	return {
		text: 'We couldn’t preview this invitation. Check your connection and try again.',
		tone: 'Error',
	};
};

const PreviewDetails = ({
	preview,
}: {
	preview: ICommunityInvitationPreview;
}) => (
	<View
		style={styles.previewDetails}
		testID='community-invitation-preview'
	>
		<View accessibilityRole='header'>
			<Typography
				size='Display'
				weight='Regular'
				style={styles.title}
			>
				{preview.communityName}
			</Typography>
		</View>
		<Typography tone='Secondary'>
			{preview.communityPurpose || 'No community purpose was provided.'}
		</Typography>
		<View style={styles.detailGroup}>
			<Typography
				size='H3'
				weight='Semibold'
			>
				Organizer
			</Typography>
			<Typography tone='Secondary'>
				{preview.organizerDisplayName || 'Name unavailable'}
			</Typography>
		</View>
		<View style={styles.detailGroup}>
			<Typography
				size='H3'
				weight='Semibold'
			>
				Invitation expires
			</Typography>
			<Typography tone='Secondary'>
				{formatExpiry(preview.expiresAt)}
			</Typography>
		</View>
		<View style={styles.detailGroup}>
			<Typography
				size='H3'
				weight='Semibold'
			>
				What to expect
			</Typography>
			<Typography tone='Secondary'>
				{preview.participationExpectations ||
					'No additional participation expectations were provided.'}
			</Typography>
		</View>
		{preview.coordinatedJourney ? (
			<View
				style={styles.scheduleCard}
				testID='community-public-schedule'
			>
				<Typography
					size='H3'
					weight='Semibold'
				>
					Optional community journey
				</Typography>
				<Typography tone='Secondary'>
					Course {preview.coordinatedJourney.course.courseId} · starts{' '}
					{preview.coordinatedJourney.startDate} (
					{preview.coordinatedJourney.timeZoneId})
				</Typography>
				<Typography tone='Secondary'>
					Joining this community does not enroll you. Sharing progress
					is also a separate choice.
				</Typography>
			</View>
		) : null}
	</View>
);

export const JoinCommunityScreen = ({
	initialCode = '',
}: IJoinCommunityScreenProps) => {
	const { account } = useAuth();
	return (
		<JoinCommunityForm
			key={account?.userId ?? 'signed-out'}
			initialCode={initialCode}
			userId={account?.userId ?? null}
		/>
	);
};

export const JoinCommunityForm = ({
	initialCode,
	userId,
}: {
	initialCode: string;
	userId: string | null;
}) => {
	const router = useRouter();
	const [code, setCode] = useState(() => formatCodeInput(initialCode));
	const [displayName, setDisplayName] = useState('');
	const [profileLoading, setProfileLoading] = useState(Boolean(userId));
	const [profileAttempt, setProfileAttempt] = useState(0);
	const [profileError, setProfileError] = useState(!userId);
	const [preview, setPreview] = useState<ICommunityInvitationPreview | null>(
		null,
	);
	const [reviewedCode, setReviewedCode] = useState<string | null>(null);
	const [previewing, setPreviewing] = useState(false);
	const [accepting, setAccepting] = useState(false);
	const [acceptanceLocked, setAcceptanceLocked] = useState(false);
	const [submittedCode, setSubmittedCode] = useState(false);
	const [submittedName, setSubmittedName] = useState(false);
	const [message, setMessage] = useState<IFormMessage | null>(null);
	const [membershipRemoved, setMembershipRemoved] = useState(false);
	const mounted = useRef(true);
	const focused = useRef(false);
	const previewGeneration = useRef(0);
	const previewRequestCode = useRef<string | null>(null);
	const acceptanceInFlight = useRef(false);
	const pendingAcceptance = useRef<IAcceptCommunityInvitationRequest | null>(
		null,
	);
	const confirmedCommunityId = useRef<string | null>(null);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			previewGeneration.current += 1;
		};
	}, []);

	useEffect(() => {
		if (!userId) return;
		let current = true;
		void loadAccountProfile(userId).then(
			(profile) => {
				if (!current) return;
				setDisplayName(profile.preferredName ?? '');
				setProfileLoading(false);
			},
			() => {
				if (!current) return;
				setProfileError(true);
				setProfileLoading(false);
			},
		);
		return () => {
			current = false;
		};
	}, [profileAttempt, userId]);

	useFocusEffect(
		useCallback(() => {
			focused.current = true;
			if (confirmedCommunityId.current)
				router.replace({
					pathname: '/communities/[communityId]',
					params: { communityId: confirmedCommunityId.current },
				});
			return () => {
				focused.current = false;
				previewGeneration.current += 1;
				previewRequestCode.current = null;
				if (
					mounted.current &&
					!acceptanceInFlight.current &&
					!pendingAcceptance.current
				) {
					setPreview(null);
					setReviewedCode(null);
					setPreviewing(false);
				}
			};
		}, [router]),
	);

	const codeError = invitationCodeError(code);
	const nameError = displayNameError(displayName);
	const changeCode = (value: string) => {
		if (acceptanceLocked || acceptanceInFlight.current) return;
		previewGeneration.current += 1;
		previewRequestCode.current = null;
		setCode(formatCodeInput(value));
		setPreview(null);
		setReviewedCode(null);
		setPreviewing(false);
		setSubmittedCode(false);
		setMembershipRemoved(false);
		setMessage(null);
	};

	const submitPreview = async () => {
		setSubmittedCode(true);
		if (codeError || !userId || profileError) return;
		const normalizedCode = normalizeCommunityInvitationCode(code);
		if (previewRequestCode.current === normalizedCode) return;
		const generation = ++previewGeneration.current;
		previewRequestCode.current = normalizedCode;
		setPreviewing(true);
		setPreview(null);
		setReviewedCode(null);
		setMessage(null);
		try {
			const nextPreview = await previewCommunityInvitation({
				invitationCode: normalizedCode,
			});
			if (!mounted.current || generation !== previewGeneration.current)
				return;
			setPreview(nextPreview);
			setReviewedCode(normalizedCode);
		} catch (error) {
			if (!mounted.current || generation !== previewGeneration.current)
				return;
			setMessage(
				previewFailureMessage(getCommunityInvitationReason(error)),
			);
		} finally {
			if (!mounted.current || generation !== previewGeneration.current)
				return;
			previewRequestCode.current = null;
			setPreviewing(false);
		}
	};

	const rejectAcceptance = (
		reason: TCommunityInvitationReasonCode | null,
	) => {
		if (reason === null || reason === 'RateLimited') {
			setMessage({
				text:
					reason === 'RateLimited'
						? 'Too many join attempts were made. Wait a little, then retry the same request.'
						: 'We couldn’t confirm whether you joined. Try again to confirm the same request.',
				tone: 'Warning',
			});
			return;
		}
		pendingAcceptance.current = null;
		setAcceptanceLocked(false);
		if (reason === 'MembershipRemoved') {
			setMembershipRemoved(true);
			setMessage({
				text: 'You can’t rejoin this community because your membership was removed.',
				tone: 'Error',
			});
			return;
		}
		if (reason === 'MembershipUnavailable') {
			setMessage({
				text: 'Your previous membership is still being updated. Try again later.',
				tone: 'Warning',
			});
			return;
		}
		if (
			reason === 'InvitationUnavailable' ||
			reason === 'CommunityClosed'
		) {
			setPreview(null);
			setReviewedCode(null);
			setMessage(previewFailureMessage(reason));
			return;
		}
		if (reason === 'EmailVerificationRequired') {
			setMessage({
				text: 'Confirm your email before joining this community.',
				tone: 'Warning',
			});
			return;
		}
		if (
			reason === 'AuthenticationRequired' ||
			reason === 'AccountUnavailable'
		) {
			setMessage({
				text: 'Your account is no longer available for this invitation.',
				tone: 'Warning',
			});
			return;
		}
		setMessage({
			text: 'The invitation could not be accepted. Preview it again before retrying.',
			tone: 'Error',
		});
	};

	const accept = async () => {
		if (acceptanceInFlight.current || !userId || !preview || !reviewedCode)
			return;
		setSubmittedName(true);
		if (nameError || membershipRemoved) return;
		acceptanceInFlight.current = true;
		setAccepting(true);
		setMessage(null);
		pendingAcceptance.current ??= {
			invitationCode: reviewedCode,
			displayName: displayName.trim(),
			operationId: createCommunityInvitationOperationId(),
		};
		setAcceptanceLocked(true);
		try {
			const result = await acceptCommunityInvitation(
				pendingAcceptance.current,
			);
			if (!mounted.current) return;
			if (
				result.membership.userId !== userId ||
				result.membership.communityId !== result.community.communityId
			)
				throw new Error('Unexpected invitation acceptance response.');
			confirmedCommunityId.current = result.community.communityId;
			pendingAcceptance.current = null;
			if (focused.current)
				router.replace({
					pathname: '/communities/[communityId]',
					params: { communityId: result.community.communityId },
				});
		} catch (error) {
			if (mounted.current)
				rejectAcceptance(getCommunityInvitationReason(error));
		} finally {
			acceptanceInFlight.current = false;
			if (mounted.current) setAccepting(false);
		}
	};

	if (profileLoading)
		return (
			<TurndownScrollScreen
				backgroundColor={SurfaceColors.Screen}
				contentPadding={Spacing.Medium}
			>
				<LoadingState label='Loading your public display name…' />
			</TurndownScrollScreen>
		);

	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentPadding={Spacing.Medium}
			bottomSpacing={Spacing.Large}
			keyboardEnabled
			testID='join-community-screen'
		>
			<View style={styles.content}>
				<View style={styles.intro}>
					<Typography
						size='Body2'
						tone='Secondary'
						style={styles.eyebrow}
					>
						JOIN A COMMUNITY
					</Typography>
					<View accessibilityRole='header'>
						<Typography
							size='Display'
							weight='Regular'
							style={styles.title}
						>
							{preview
								? 'Review this invitation'
								: 'Enter your invitation code'}
						</Typography>
					</View>
					<Typography tone='Secondary'>
						Previewing never joins a community. You will confirm
						before anything changes.
					</Typography>
				</View>

				{profileError ? (
					<View style={styles.actions}>
						<View accessibilityRole='alert'>
							<Typography tone='Error'>
								We couldn’t load the public display name for
								your account.
							</Typography>
						</View>
						<TurndownButton
							variant='Outline'
							onPress={() => {
								setProfileLoading(true);
								setProfileError(false);
								setProfileAttempt((value) => value + 1);
							}}
						>
							Try again
						</TurndownButton>
					</View>
				) : null}

				{!preview ? (
					<View style={styles.formSection}>
						<Input
							label='Invitation code'
							placeholder='23456-789AB-CDEFG-HJKMN'
							value={code}
							onChange={changeCode}
							readOnly={acceptanceLocked}
							ignoreForm
							testID='community-invitation-code'
							{...(submittedCode && codeError
								? { errorMessage: codeError }
								: {})}
						/>
						<TurndownButton
							loading={previewing}
							disabled={previewing || profileError}
							onPress={() => void submitPreview()}
						>
							Preview community
						</TurndownButton>
					</View>
				) : (
					<>
						<PreviewDetails preview={preview} />
						<View
							style={styles.privacyCard}
							accessibilityRole='text'
						>
							<Typography
								size='H3'
								weight='Semibold'
							>
								What members can see
							</Typography>
							<Typography tone='Secondary'>
								Material you deliberately post is visible to
								current and future members. Your private
								reflections, intentions, practice choices,
								completion details, and personal journeys remain
								private.
							</Typography>
							<Typography tone='Secondary'>
								Joining does not share progress or enroll you in
								a coordinated journey. Those are separate
								choices.
							</Typography>
						</View>
						<View style={styles.formSection}>
							<Input
								label='Public display name'
								value={displayName}
								onChange={(value) => {
									if (
										acceptanceLocked ||
										acceptanceInFlight.current
									)
										return;
									setDisplayName(value);
									setSubmittedName(false);
									setMessage(null);
								}}
								readOnly={acceptanceLocked}
								ignoreForm
								testID='community-display-name'
								{...(submittedName && nameError
									? { errorMessage: nameError }
									: {})}
							/>
							<Typography
								size='Body2'
								tone='Muted'
							>
								This is the name current and future members will
								see. Joining updates your public display name to
								this value; it does not share or change your
								email or other contact details.
							</Typography>
						</View>
						<View style={styles.actions}>
							<TurndownButton
								loading={accepting}
								disabled={accepting || membershipRemoved}
								onPress={() => void accept()}
							>
								Join community
							</TurndownButton>
							<TurndownButton
								variant='Outline'
								disabled={acceptanceLocked || accepting}
								onPress={() => changeCode('')}
							>
								Use a different code
							</TurndownButton>
						</View>
					</>
				)}

				{message ? (
					<View
						accessibilityLiveRegion='polite'
						accessibilityRole='alert'
					>
						<Typography tone={message.tone}>
							{message.text}
						</Typography>
					</View>
				) : null}
			</View>
		</TurndownScrollScreen>
	);
};
