import { JoinCommunityScreen } from '@td/features/communities/screens/join-community.screen';
import { useLocalSearchParams } from 'expo-router';

const JoinCommunityRoute = () => {
	const { invitationCode } = useLocalSearchParams<{
		invitationCode?: string | string[];
	}>();
	return (
		<JoinCommunityScreen
			initialCode={
				typeof invitationCode === 'string' ? invitationCode : ''
			}
		/>
	);
};

export default JoinCommunityRoute;
