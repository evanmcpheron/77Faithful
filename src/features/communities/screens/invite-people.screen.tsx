import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import { ComponentTone } from '@td/types/ui.types';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import { Alert, Share, Text, View } from 'react-native';
import { buildCommunityInvitationLink } from '../community-invite-intent';
import {
	type TCommunityContextState,
	useCommunityContext,
} from '../use-community-context.hook';
import {
	type TCommunityInvitationMutation,
	type TCommunityInvitationScreenState,
	useCommunityInvitation,
} from '../use-community-invitation.hook';
import { invitePeopleStyles as styles } from './invite-people.styles';

export const buildInvitationShareMessage = ({
	communityName,
	code,
	link = buildCommunityInvitationLink(
		code,
		typeof Constants.expoConfig?.scheme === 'string'
			? Constants.expoConfig.scheme
			: 'mobile',
	),
}: {
	communityName: string;
	code: string;
	link?: string;
}): string =>
	[
		`You’re invited to join ${communityName} in 77Faithful.`,
		`Open invitation: ${link}`,
		`Invitation code: ${code}`,
		'Open 77Faithful, choose Join a community, and enter this code. If the app is not installed yet, keep the code until you can install and open 77Faithful.',
	].join('\n\n');

export const formatInvitationExpiry = (expiresAt: {
	seconds: number;
	nanoseconds: number;
}): string =>
	new Intl.DateTimeFormat(undefined, {
		dateStyle: 'long',
		timeStyle: 'short',
	}).format(
		new Date(expiresAt.seconds * 1_000 + expiresAt.nanoseconds / 1_000_000),
	);

interface IInvitePeopleManagerProps {
	communityName: string;
	state: TCommunityInvitationScreenState;
	mutation: TCommunityInvitationMutation;
	mutationMessage: string | null;
	onGenerate: () => void;
	onRotate: () => void;
	onRevoke: () => void;
	onRetry: () => void;
	onReturn: () => void;
}

export const InvitePeopleManager = ({
	communityName,
	state,
	mutation,
	mutationMessage,
	onGenerate,
	onRotate,
	onRevoke,
	onRetry,
	onReturn,
}: IInvitePeopleManagerProps) => {
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	const [actionError, setActionError] = useState(false);

	if (state.status === 'Loading' || state.status === 'Idle') {
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
				accessibilityState={{ busy: true }}
			>
				<Typography size='H1'>Loading invitation…</Typography>
			</View>
		);
	}

	if (state.status === 'Unavailable') {
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
			>
				<View accessibilityRole='header'>
					<Typography size='H1'>
						Invitations are unavailable
					</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Your organizer access may have changed, or this community
					may be closed.
				</Typography>
				<TurndownButton
					variant='Outline'
					onPress={onReturn}
				>
					Return to community
				</TurndownButton>
			</View>
		);
	}

	if (state.status === 'Error') {
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
			>
				<View accessibilityRole='header'>
					<Typography size='H1'>
						We couldn’t load the invitation.
					</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Check your connection and try again.
				</Typography>
				<View style={styles.actions}>
					<TurndownButton onPress={onRetry}>Try again</TurndownButton>
					<TurndownButton
						variant='Outline'
						onPress={onReturn}
					>
						Return to community
					</TurndownButton>
				</View>
			</View>
		);
	}

	const copyCode = async () => {
		if (state.status !== 'Ready') return;
		setActionMessage(null);
		try {
			await Clipboard.setStringAsync(state.invitation.code);
			setActionError(false);
			setActionMessage('Invitation code copied.');
		} catch {
			setActionError(true);
			setActionMessage(
				'We couldn’t copy the invitation code. Please try again.',
			);
		}
	};

	const shareInvitation = async () => {
		if (state.status !== 'Ready') return;
		setActionMessage(null);
		try {
			const result = await Share.share({
				message: buildInvitationShareMessage({
					communityName,
					code: state.invitation.code,
				}),
			});
			setActionError(false);
			if (result.action === Share.dismissedAction) setActionMessage(null);
		} catch {
			setActionError(true);
			setActionMessage(
				'We couldn’t open sharing options. Please try again.',
			);
		}
	};

	const confirmRotation = () => {
		Alert.alert(
			'Replace this invitation?',
			'The current code will stop working. Existing members will remain in the community.',
			[
				{ text: 'Keep invitation', style: 'cancel' },
				{
					text: 'Replace invitation',
					style: 'destructive',
					onPress: onRotate,
				},
			],
		);
	};

	const confirmRevocation = () => {
		Alert.alert(
			'Revoke this invitation?',
			'The current code will stop working. Existing members will remain in the community.',
			[
				{ text: 'Keep invitation', style: 'cancel' },
				{
					text: 'Revoke invitation',
					style: 'destructive',
					onPress: onRevoke,
				},
			],
		);
	};

	return (
		<View style={styles.content}>
			<View style={styles.section}>
				<View accessibilityRole='header'>
					<Typography size='Display'>Invite people</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Share this invitation only with people you want to welcome
					to
					{` ${communityName}`}.
				</Typography>
			</View>

			{state.status === 'None' ? (
				<Card>
					<View style={styles.section}>
						<Typography size='H2'>No active invitation</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							Generate an invitation when you’re ready to welcome
							people.
						</Typography>
						<TurndownButton
							loading={mutation === 'Issue'}
							disabled={mutation !== null}
							onPress={onGenerate}
						>
							Generate invitation
						</TurndownButton>
					</View>
				</Card>
			) : (
				<>
					<Card>
						<View style={styles.section}>
							<Typography size='H2'>
								Current invitation code
							</Typography>
							<Text
								selectable
								style={styles.code}
								accessibilityLabel={`Invitation code ${state.invitation.code}`}
								testID='invitation-code'
							>
								{state.invitation.code}
							</Text>
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								Expires{' '}
								{formatInvitationExpiry(
									state.invitation.expiresAt,
								)}
							</Typography>
						</View>
					</Card>

					<View style={styles.actions}>
						<TurndownButton
							disabled={mutation !== null}
							onPress={() => void copyCode()}
						>
							Copy code
						</TurndownButton>
						<TurndownButton
							variant='Outline'
							disabled={mutation !== null}
							onPress={() => void shareInvitation()}
						>
							Share invitation
						</TurndownButton>
					</View>

					<View style={styles.section}>
						<Typography size='H2'>Manage invitation</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							Replacing or revoking this invitation stops the
							current code. Existing members remain in the
							community.
						</Typography>
						<View style={styles.actions}>
							<TurndownButton
								variant='Outline'
								loading={mutation === 'Rotate'}
								disabled={mutation !== null}
								onPress={confirmRotation}
							>
								Replace invitation
							</TurndownButton>
							<TurndownButton
								variant='Outline'
								tone={ComponentTone.Error}
								loading={mutation === 'Revoke'}
								disabled={mutation !== null}
								onPress={confirmRevocation}
							>
								Revoke invitation
							</TurndownButton>
						</View>
					</View>
				</>
			)}

			{mutationMessage || actionMessage ? (
				<View
					accessibilityLiveRegion='polite'
					accessibilityRole={
						mutationMessage || actionError ? 'alert' : 'text'
					}
				>
					<Typography
						tone={
							mutationMessage || actionError ? 'Error' : 'Success'
						}
						weight='Regular'
					>
						{mutationMessage ?? actionMessage}
					</Typography>
				</View>
			) : null}

			<Typography
				size='Body2'
				tone='Secondary'
				weight='Regular'
			>
				Joining this community does not share anyone’s private
				reflections, practice choices, completion, or personal journey.
			</Typography>
		</View>
	);
};

interface IInvitePeopleContentProps {
	userId: string | null;
	communityId: string | undefined;
	contextState: TCommunityContextState;
	onContextRetry: () => void;
}

export const InvitePeopleContent = ({
	userId,
	communityId,
	contextState,
	onContextRetry,
}: IInvitePeopleContentProps) => {
	const router = useRouter();
	const canManage =
		contextState.status === 'Ready' &&
		contextState.context.community.status === 'Active' &&
		contextState.context.capabilities.canInviteMembers;
	const invitation = useCommunityInvitation({
		userId,
		communityId,
		canManage,
	});
	const returnToCommunity = () => {
		if (!communityId) {
			router.replace('/communities');
			return;
		}
		router.replace({
			pathname: '/communities/[communityId]',
			params: { communityId },
		});
	};

	if (contextState.status === 'Loading') {
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
				accessibilityState={{ busy: true }}
			>
				<Typography size='H1'>Checking organizer access…</Typography>
			</View>
		);
	}

	if (contextState.status === 'Error') {
		return (
			<View style={styles.section}>
				<View accessibilityRole='header'>
					<Typography size='H1'>
						We couldn’t check your access.
					</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Check your connection and try again.
				</Typography>
				<TurndownButton onPress={onContextRetry}>
					Try again
				</TurndownButton>
			</View>
		);
	}

	if (
		contextState.status === 'Unavailable' ||
		contextState.status !== 'Ready' ||
		!canManage
	) {
		const isClosed =
			contextState.status === 'Ready' &&
			contextState.context.community.status === 'Closed';
		return (
			<View
				style={styles.section}
				accessibilityLiveRegion='polite'
			>
				<View accessibilityRole='header'>
					<Typography size='H1'>
						Invitations are unavailable
					</Typography>
				</View>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					{isClosed
						? 'This community is closed, so invitations cannot be managed. Existing members remain.'
						: 'Only the current organizer can manage invitations for this community.'}
				</Typography>
				<TurndownButton
					variant='Outline'
					onPress={returnToCommunity}
				>
					Return to community
				</TurndownButton>
			</View>
		);
	}

	return (
		<InvitePeopleManager
			communityName={contextState.context.community.name}
			state={invitation.state}
			mutation={invitation.mutation}
			mutationMessage={invitation.mutationMessage}
			onGenerate={() => void invitation.issue()}
			onRotate={() => void invitation.rotate()}
			onRevoke={() => void invitation.revoke()}
			onRetry={invitation.retry}
			onReturn={returnToCommunity}
		/>
	);
};

const InvitePeopleDetails = ({
	userId,
	communityId,
}: {
	userId: string | null;
	communityId: string | undefined;
}) => {
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const { state, retry } = useCommunityContext(userId, communityId);

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
			testID='invite-people-screen'
		>
			<View style={{ paddingTop: headerHeight }}>
				<InvitePeopleContent
					userId={userId}
					communityId={communityId}
					contextState={state}
					onContextRetry={retry}
				/>
			</View>
		</TurndownScrollScreen>
	);
};

export const InvitePeopleScreen = () => {
	const { communityId } = useLocalSearchParams<{ communityId?: string }>();
	const { account } = useAuth();
	const userId = account?.userId ?? null;
	return (
		<InvitePeopleDetails
			key={`${userId ?? 'signed-out'}:${communityId ?? 'missing'}`}
			userId={userId}
			communityId={communityId}
		/>
	);
};
