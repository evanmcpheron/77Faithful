import { Input } from '@td/components/form/input/input.component';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { ICommunityContext } from '@td/types/community/community.types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import {
	closeCommunity,
	createCommunityAdministrationOperationId,
	getCommunityAdministrationReason,
	leaveCommunity,
	updateCommunity,
} from '../community-administration.service';
import { CommunityCreationLimits } from '../community-creation';
import {
	type TCommunityContextState,
	useCommunityContext,
} from '../use-community-context.hook';
import { communitySettingsStyles as styles } from './community-settings.styles';

interface ICommunitySettingsFields {
	name: string;
	purpose: string;
	participationExpectations: string;
}

type TSettingsAction = 'Save' | 'Close' | 'Leave' | null;

const fieldsFromContext = ({
	community,
}: ICommunityContext): ICommunitySettingsFields => ({
	name: community.name,
	purpose: community.purpose,
	participationExpectations: community.participationExpectations ?? '',
});

const permissionChangeReasons = new Set([
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'AccountUnavailable',
	'CommunityUnavailable',
	'CommunityClosed',
	'OrganizerRequired',
]);

const rejectedMutationReasons = new Set([
	'InvalidInput',
	'MemberUnavailable',
	'OrganizerTransferRequired',
	'OperationPayloadMismatch',
	'AdministrationDataUnavailable',
]);

interface ICommunitySettingsViewProps {
	state: TCommunityContextState;
	fields: ICommunitySettingsFields | null;
	submitted: boolean;
	dirty: boolean;
	action: TSettingsAction;
	message: string | null;
	conflict: boolean;
	uncertainSave: boolean;
	onChange: (field: keyof ICommunitySettingsFields, value: string) => void;
	onSave: () => void;
	onCancel: () => void;
	onReviewLatest: () => void;
	onRetry: () => void;
	onMembers: () => void;
	onNotifications?: () => void;
	onInvite: () => void;
	onSchedule?: () => void;
	onContributions?: () => void;
	onReport?: () => void;
	onClose: () => void;
	onLeave: () => void;
	onReturn: () => void;
}

const fieldErrors = (fields: ICommunitySettingsFields | null) => ({
	name: !fields?.name.trim()
		? 'Enter a community name.'
		: fields.name.length > CommunityCreationLimits.name
			? 'Use 100 characters or fewer for the community name.'
			: undefined,
	purpose:
		(fields?.purpose.length ?? 0) > CommunityCreationLimits.purpose
			? 'Use 2,000 characters or fewer for the description.'
			: undefined,
	expectations:
		(fields?.participationExpectations.length ?? 0) >
		CommunityCreationLimits.participationExpectations
			? 'Use 2,000 characters or fewer for participation expectations.'
			: undefined,
});

const StateContent = ({
	state,
	onRetry,
	onReturn,
}: Pick<ICommunitySettingsViewProps, 'state' | 'onRetry' | 'onReturn'>) => {
	if (state.status === 'Loading')
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
				accessibilityState={{ busy: true }}
			>
				<Typography size='H1'>Loading community settings…</Typography>
			</View>
		);
	if (state.status === 'Unavailable')
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
			>
				<View accessibilityRole='header'>
					<Typography size='H1'>
						Community settings are unavailable
					</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Your membership or permission may have changed.
				</Typography>
				<TurndownButton onPress={onReturn}>
					Your communities
				</TurndownButton>
			</View>
		);
	return (
		<View
			style={styles.section}
			accessibilityLiveRegion='polite'
		>
			<View accessibilityRole='header'>
				<Typography size='H1'>
					We couldn’t load community settings.
				</Typography>
			</View>
			<Typography
				tone='Secondary'
				weight='Regular'
			>
				Check your connection and try again.
			</Typography>
			<TurndownButton onPress={onRetry}>Try again</TurndownButton>
		</View>
	);
};

export const CommunitySettingsView = ({
	state,
	fields,
	submitted,
	dirty,
	action,
	message,
	conflict,
	uncertainSave,
	onChange,
	onSave,
	onCancel,
	onReviewLatest,
	onRetry,
	onMembers,
	onNotifications,
	onInvite,
	onSchedule,
	onContributions,
	onReport,
	onClose,
	onLeave,
	onReturn,
}: ICommunitySettingsViewProps) => {
	if (state.status !== 'Ready' || !fields)
		return (
			<StateContent
				state={state}
				onRetry={onRetry}
				onReturn={onReturn}
			/>
		);

	const { community, membership, capabilities } = state.context;
	const errors = fieldErrors(fields);
	const isActive = community.status === 'Active';
	const canEdit = isActive && capabilities.canEditCommunity;
	const isBusy = action !== null;

	return (
		<View style={styles.content}>
			<View style={styles.section}>
				<View accessibilityRole='header'>
					<Typography size='Display'>Community settings</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Community details are visible to members. Membership never
					shares private writing, practice choices, completion, or
					personal journeys.
				</Typography>
			</View>

			{community.status === 'Closed' ? (
				<Card>
					<View style={styles.section}>
						<Typography size='H2'>Read-only archive</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							This community is closed. Invitations and new group
							activity are disabled. Personal journeys were not
							changed, and the archive cannot be reopened.
						</Typography>
					</View>
				</Card>
			) : null}
			{onReport ? (
				<TurndownButton
					variant='Outline'
					onPress={onReport}
					testID='report-community'
				>
					Report community
				</TurndownButton>
			) : null}

			{canEdit ? (
				<View style={styles.fields}>
					<Input
						label='Community name'
						value={fields.name}
						onChange={(value) => onChange('name', value)}
						readOnly={uncertainSave || isBusy}
						{...(submitted && errors.name
							? { errorMessage: errors.name }
							: {})}
						ignoreForm
						testID='community-settings-name'
					/>
					<Input
						label='Description (optional)'
						value={fields.purpose}
						onChange={(value) => onChange('purpose', value)}
						readOnly={uncertainSave || isBusy}
						{...(submitted && errors.purpose
							? { errorMessage: errors.purpose }
							: {})}
						multiline
						ignoreForm
						testID='community-settings-description'
					/>
					<Input
						label='Participation expectations (optional)'
						value={fields.participationExpectations}
						onChange={(value) =>
							onChange('participationExpectations', value)
						}
						readOnly={uncertainSave || isBusy}
						{...(submitted && errors.expectations
							? { errorMessage: errors.expectations }
							: {})}
						multiline
						ignoreForm
						testID='community-settings-expectations'
					/>
					<View style={styles.actions}>
						<TurndownButton
							disabled={!dirty || conflict || isBusy}
							loading={action === 'Save'}
							onPress={onSave}
						>
							{uncertainSave ? 'Retry save' : 'Save changes'}
						</TurndownButton>
						{conflict ? (
							<TurndownButton
								variant='Outline'
								onPress={onReviewLatest}
							>
								Review latest details
							</TurndownButton>
						) : (
							<TurndownButton
								variant='Outline'
								disabled={!dirty || uncertainSave || isBusy}
								onPress={onCancel}
							>
								Cancel changes
							</TurndownButton>
						)}
					</View>
				</View>
			) : (
				<Card>
					<View style={styles.section}>
						<Typography size='H2'>{community.name}</Typography>
						{community.purpose ? (
							<Typography weight='Regular'>
								{community.purpose}
							</Typography>
						) : null}
						{community.participationExpectations ? (
							<>
								<Typography size='H3'>
									How we participate
								</Typography>
								<Typography weight='Regular'>
									{community.participationExpectations}
								</Typography>
							</>
						) : null}
					</View>
				</Card>
			)}

			{message ? (
				<View
					accessibilityLiveRegion='polite'
					accessibilityRole='alert'
				>
					<Typography
						tone={conflict ? 'Error' : 'Secondary'}
						weight='Regular'
					>
						{message}
					</Typography>
				</View>
			) : null}

			{onSchedule ? (
				<View style={styles.section}>
					<Typography size='H2'>Community journey</Typography>
					<TurndownButton
						variant='Outline'
						onPress={onSchedule}
						testID='community-settings-schedule'
					>
						{membership.role === 'Organizer' && isActive
							? 'Schedule community journey'
							: 'View community schedule'}
					</TurndownButton>
				</View>
			) : null}

			{onNotifications ? (
				<View style={styles.section}>
					<Typography size='H2'>Notifications</Typography>
					<TurndownButton
						variant='Outline'
						onPress={onNotifications}
						testID='community-notification-settings-link'
					>
						Notification preferences
					</TurndownButton>
				</View>
			) : null}

			<View style={styles.section}>
				<Typography size='H2'>People</Typography>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Shared posts and replies remain after leaving or closing
					unless you separately delete them. Material already viewed
					or copied cannot be recalled.
				</Typography>
				{onContributions ? (
					<TurndownButton
						variant='Outline'
						onPress={onContributions}
					>
						Shared Contributions
					</TurndownButton>
				) : null}
				<TurndownButton
					variant='Outline'
					onPress={onMembers}
				>
					Members
				</TurndownButton>
				{capabilities.canInviteMembers ? (
					<TurndownButton
						variant='Outline'
						onPress={onInvite}
					>
						Invite people
					</TurndownButton>
				) : null}
				{membership.role === 'Organizer' && isActive ? (
					<Typography
						size='Body2'
						tone='Secondary'
						weight='Regular'
					>
						To leave an active community, transfer ownership through
						Members or close the community first.
					</Typography>
				) : capabilities.canLeaveCommunity ? (
					<TurndownButton
						variant='Outline'
						tone='Error'
						disabled={isBusy}
						loading={action === 'Leave'}
						onPress={onLeave}
					>
						Leave community
					</TurndownButton>
				) : null}
			</View>

			{capabilities.canCloseCommunity ? (
				<Card>
					<View style={styles.section}>
						<Typography size='H2'>Close community</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							Closing creates a read-only archive. It disables
							invitations and new group activity, leaves personal
							journeys untouched, and cannot be undone.
						</Typography>
						<TurndownButton
							variant='Outline'
							tone='Error'
							disabled={isBusy}
							loading={action === 'Close'}
							onPress={onClose}
						>
							Close community
						</TurndownButton>
					</View>
				</Card>
			) : null}
		</View>
	);
};

const confirmClosure = (onClose: () => void) =>
	Alert.alert(
		'Close this community?',
		'Closing makes this community a read-only archive. Invitations and new group activity will stop. Shared posts remain unless separately deleted in Shared Contributions. Personal journeys remain untouched. This cannot be undone.',
		[
			{ text: 'Keep community open', style: 'cancel' },
			{ text: 'Close community', style: 'destructive', onPress: onClose },
		],
	);

const confirmLeave = (onLeave: () => void) =>
	Alert.alert(
		'Leave this community?',
		'You will lose community access. Content you deliberately shared remains in the archive until you separately delete it. Your private journey is not changed.',
		[
			{ text: 'Stay in community', style: 'cancel' },
			{ text: 'Leave community', style: 'destructive', onPress: onLeave },
		],
	);

export const CommunitySettingsContent = ({
	userId,
	communityId,
}: {
	userId: string | null;
	communityId: string | undefined;
}) => {
	const router = useRouter();
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const context = useCommunityContext(userId, communityId);
	const [fields, setFields] = useState<ICommunitySettingsFields | null>(null);
	const [submitted, setSubmitted] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [action, setAction] = useState<TSettingsAction>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [conflict, setConflict] = useState(false);
	const [uncertainSave, setUncertainSave] = useState(false);
	const pendingSave = useRef<Parameters<typeof updateCommunity>[0] | null>(
		null,
	);
	const pendingClose = useRef<Parameters<typeof closeCommunity>[0] | null>(
		null,
	);
	const pendingLeave = useRef<Parameters<typeof leaveCommunity>[0] | null>(
		null,
	);
	const inFlight = useRef(false);
	const generation = useRef(0);
	const syncedRevision = useRef<number | null>(null);
	const currentContext =
		context.state.status === 'Ready' ? context.state.context : null;

	useFocusEffect(
		useCallback(() => {
			const focusGeneration = ++generation.current;
			setAction(null);
			if (pendingSave.current) {
				setUncertainSave(true);
				setMessage(
					'We couldn’t confirm whether your changes were saved. Your details are still here. Retry to confirm the same request.',
				);
			} else if (pendingClose.current) {
				setMessage(
					'We couldn’t confirm whether the community was closed. Try again to confirm the same request.',
				);
			} else if (pendingLeave.current) {
				setMessage(
					'We couldn’t confirm whether the community was left. Try again to confirm the same request.',
				);
			}
			return () => {
				if (generation.current === focusGeneration)
					generation.current += 1;
				inFlight.current = false;
			};
		}, []),
	);

	useEffect(() => {
		if (
			!currentContext ||
			dirty ||
			pendingSave.current ||
			(fields !== null &&
				syncedRevision.current === currentContext.communityRevision)
		)
			return;
		setFields(fieldsFromContext(currentContext));
		syncedRevision.current = currentContext.communityRevision;
	}, [currentContext, dirty, fields]);
	useEffect(
		() => () => {
			generation.current += 1;
			inFlight.current = false;
		},
		[],
	);
	const change = (field: keyof ICommunitySettingsFields, value: string) => {
		if (
			inFlight.current ||
			uncertainSave ||
			!currentContext?.capabilities.canEditCommunity
		)
			return;
		setFields((current) =>
			current ? { ...current, [field]: value } : current,
		);
		setDirty(true);
		setSubmitted(false);
		setMessage(null);
	};
	const cancel = () => {
		if (!currentContext || inFlight.current || uncertainSave) return;
		setFields(fieldsFromContext(currentContext));
		setDirty(false);
		setSubmitted(false);
		setConflict(false);
		setMessage(null);
		pendingSave.current = null;
	};
	const reviewLatest = () => {
		if (!currentContext || inFlight.current) return;
		setFields(fieldsFromContext(currentContext));
		setDirty(false);
		setSubmitted(false);
		setConflict(false);
		setMessage(null);
	};
	const save = async () => {
		if (
			inFlight.current ||
			!userId ||
			!communityId ||
			!fields ||
			!currentContext?.capabilities.canEditCommunity ||
			conflict
		)
			return;
		setSubmitted(true);
		const errors = fieldErrors(fields);
		if (errors.name || errors.purpose || errors.expectations) return;
		inFlight.current = true;
		const currentGeneration = generation.current;
		setAction('Save');
		setMessage(null);
		pendingSave.current ??= {
			communityId,
			name: fields.name,
			purpose: fields.purpose,
			settings: fields.participationExpectations
				? {
						participationExpectations:
							fields.participationExpectations,
					}
				: {},
			expectedRevision: currentContext.communityRevision,
			operationId: createCommunityAdministrationOperationId(),
		};
		try {
			const result = await updateCommunity(pendingSave.current);
			if (
				currentGeneration !== generation.current ||
				result.community.communityId !== communityId
			)
				return;
			pendingSave.current = null;
			setFields({
				name: result.community.name,
				purpose: result.community.purpose,
				participationExpectations:
					result.community.participationExpectations ?? '',
			});
			setDirty(false);
			setUncertainSave(false);
			setMessage('Community details were saved.');
			context.retry();
		} catch (error: unknown) {
			if (currentGeneration !== generation.current) return;
			const reason = getCommunityAdministrationReason(error);
			if (reason === 'RevisionConflict') {
				pendingSave.current = null;
				setConflict(true);
				setUncertainSave(false);
				setMessage(
					'Someone changed these details first. Your edits were not saved. Review the latest details before editing again.',
				);
				context.retry();
			} else if (reason && permissionChangeReasons.has(reason)) {
				pendingSave.current = null;
				setUncertainSave(false);
				setMessage(
					'The community or your permissions changed. The latest settings are loading.',
				);
				context.retry();
			} else if (reason && rejectedMutationReasons.has(reason)) {
				pendingSave.current = null;
				setUncertainSave(false);
				setMessage(
					'We couldn’t save these details. Review them and try again.',
				);
			} else {
				setUncertainSave(true);
				setMessage(
					'We couldn’t confirm whether your changes were saved. Your details are still here. Retry to confirm the same request.',
				);
			}
		} finally {
			if (currentGeneration === generation.current) {
				inFlight.current = false;
				setAction(null);
			}
		}
	};

	const runExitAction = async (kind: 'Close' | 'Leave') => {
		if (inFlight.current || !userId || !communityId || !currentContext)
			return;
		if (
			(kind === 'Close' &&
				!currentContext.capabilities.canCloseCommunity) ||
			(kind === 'Leave' && !currentContext.capabilities.canLeaveCommunity)
		)
			return;
		inFlight.current = true;
		const currentGeneration = generation.current;
		setAction(kind);
		setMessage(null);
		try {
			if (kind === 'Close') {
				pendingClose.current ??= {
					communityId,
					expectedRevision: currentContext.communityRevision,
					operationId: createCommunityAdministrationOperationId(),
				};
				await closeCommunity(pendingClose.current);
			} else {
				pendingLeave.current ??= {
					communityId,
					operationId: createCommunityAdministrationOperationId(),
				};
				await leaveCommunity(pendingLeave.current);
			}
			if (currentGeneration !== generation.current) return;
			if (kind === 'Close') pendingClose.current = null;
			else pendingLeave.current = null;
			router.replace(
				kind === 'Close'
					? {
							pathname: '/communities/[communityId]',
							params: { communityId },
						}
					: '/communities',
			);
		} catch (error: unknown) {
			if (currentGeneration !== generation.current) return;
			const reason = getCommunityAdministrationReason(error);
			if (
				reason === 'RevisionConflict' ||
				(reason && permissionChangeReasons.has(reason))
			) {
				if (kind === 'Close') pendingClose.current = null;
				else pendingLeave.current = null;
				setMessage(
					'The community or your permissions changed. The latest settings are loading.',
				);
				context.retry();
			} else if (reason && rejectedMutationReasons.has(reason)) {
				if (kind === 'Close') pendingClose.current = null;
				else pendingLeave.current = null;
				setMessage(
					`We couldn’t ${kind.toLowerCase()} this community. Review the latest details and try again.`,
				);
			} else {
				setMessage(
					`We couldn’t confirm whether the community was ${kind === 'Close' ? 'closed' : 'left'}. Try again to confirm the same request.`,
				);
			}
		} finally {
			if (currentGeneration === generation.current) {
				inFlight.current = false;
				setAction(null);
			}
		}
	};

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
			testID='community-settings-screen'
		>
			<View style={{ paddingTop: headerHeight }}>
				<CommunitySettingsView
					state={context.state}
					fields={fields}
					submitted={submitted}
					dirty={dirty}
					action={action}
					message={message}
					conflict={conflict}
					uncertainSave={uncertainSave}
					onChange={change}
					onSave={() => void save()}
					onCancel={cancel}
					onReviewLatest={reviewLatest}
					onRetry={context.retry}
					onMembers={() =>
						communityId &&
						router.push({
							pathname: '/communities/[communityId]/members',
							params: { communityId },
						})
					}
					onNotifications={() =>
						communityId &&
						router.push({
							pathname:
								'/communities/[communityId]/notification-settings',
							params: { communityId },
						})
					}
					onInvite={() =>
						communityId &&
						router.push({
							pathname: '/communities/[communityId]/invite',
							params: { communityId },
						})
					}
					onSchedule={() =>
						communityId &&
						router.push({
							pathname: '/communities/[communityId]/schedule',
							params: { communityId },
						})
					}
					onContributions={() =>
						router.push('/settings/shared-contributions')
					}
					onReport={() =>
						communityId &&
						router.push({
							pathname: '/communities/[communityId]/report',
							params: { communityId, targetType: 'Community' },
						})
					}
					onClose={() =>
						confirmClosure(() => void runExitAction('Close'))
					}
					onLeave={() =>
						confirmLeave(() => void runExitAction('Leave'))
					}
					onReturn={() => router.replace('/communities')}
				/>
			</View>
		</TurndownScrollScreen>
	);
};

export const CommunitySettingsScreen = () => {
	const { communityId } = useLocalSearchParams<{ communityId?: string }>();
	const { account } = useAuth();
	const userId = account?.userId ?? null;
	return (
		<CommunitySettingsContent
			key={`${userId ?? 'signed-out'}:${communityId ?? 'missing'}`}
			userId={userId}
			communityId={communityId}
		/>
	);
};
