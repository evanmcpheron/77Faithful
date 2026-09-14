import { useCommunityInviteIntent } from '@td/features/communities/community-invite-intent.provider';
import { JoinCommunityScreen } from '@td/features/communities/screens/join-community.screen';

const JoinCommunityRoute = () => {
	const invitationIntent = useCommunityInviteIntent();
	return (
		<JoinCommunityScreen
			initialCode={invitationIntent.pendingCode ?? ''}
			previewOnLoad={Boolean(invitationIntent.pendingCode)}
			onCancelIntent={invitationIntent.cancel}
			onInvitationUnavailable={invitationIntent.cancel}
			onPreviewResolved={invitationIntent.recordPreviewExpiry}
			onAccepted={invitationIntent.complete}
		/>
	);
};

export default JoinCommunityRoute;
