import { useAuth } from '@td/providers/auth/auth.hook';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { listCommunities } from '../community-reader.service';
import {
	CommunitiesScreen,
	type TCommunitiesScreenState,
} from './communities.screen';

export const CommunitiesConnectedScreen = () => {
	const { account } = useAuth();
	return (
		<AccountCommunitiesScreen
			key={account?.userId ?? 'signed-out'}
			userId={account?.userId ?? null}
		/>
	);
};
const AccountCommunitiesScreen = ({ userId }: { userId: string | null }) => {
	const [state, setState] = useState<TCommunitiesScreenState>({
		status: 'Loading',
	});
	const [attempt, setAttempt] = useState(0);
	useFocusEffect(
		useCallback(() => {
			let active = true;
			if (!userId) {
				setState({ status: 'Unavailable' });
				return;
			}
			setState({ status: 'Loading' });
			void listCommunities().then(
				(communities) => {
					if (active) setState({ status: 'Ready', communities });
				},
				() => {
					if (active)
						setState({
							status: 'Error',
							onRetry: () => setAttempt((value) => value + 1),
						});
				},
			);
			return () => {
				active = false;
			};
			// Retry changes intentionally rerun this focused-screen load.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [userId, attempt]),
	);
	return <CommunitiesScreen state={state} />;
};
