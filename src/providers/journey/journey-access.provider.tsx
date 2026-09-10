import { useAuth } from '@td/providers/auth/auth.hook';
import { db } from '@td/services/firebase/firebase.instance';
import { JourneyStatus } from '@td/types/journey/journey.types';
import {
	collection,
	limit,
	onSnapshot,
	query,
	where,
} from 'firebase/firestore';
import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react';

interface IJourneyAccessState {
	userId: string;
	hasJourney: boolean;
	hasError: boolean;
}
interface IJourneyAccessContext {
	hasJourney: boolean;
	isLoading: boolean;
	hasError: boolean;
	retry: () => void;
}
const JourneyAccessContext = createContext<IJourneyAccessContext | null>(null);

export const JourneyAccessProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	const { account, isProfileReady } = useAuth();
	const userId =
		account?.isEmailConfirmed && isProfileReady ? account.userId : null;
	const [access, setAccess] = useState<IJourneyAccessState | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	// Clear account-specific access immediately, including sign-out followed by the same account.
	if (access && access.userId !== userId) setAccess(null);

	useEffect(() => {
		if (!userId) return;
		let isCurrent = true;
		const journeyQuery = query(
			collection(db, 'users', userId, 'journeys'),
			where('state.status', 'in', Object.values(JourneyStatus)),
			limit(1),
		);
		const unsubscribe = onSnapshot(
			journeyQuery,
			{ includeMetadataChanges: true },
			(snapshot) => {
				if (
					!isCurrent ||
					snapshot.metadata.hasPendingWrites ||
					(snapshot.empty && snapshot.metadata.fromCache)
				)
					return;
				setAccess({
					userId,
					hasJourney: !snapshot.empty,
					hasError: false,
				});
			},
			() => {
				if (isCurrent)
					setAccess({ userId, hasJourney: false, hasError: true });
			},
		);
		return () => {
			isCurrent = false;
			unsubscribe();
		};
	}, [userId, retryCount]);

	const retry = () => {
		setAccess(null);
		setRetryCount((count) => count + 1);
	};
	return (
		<JourneyAccessContext.Provider
			value={{
				isLoading: userId !== null && access?.userId !== userId,
				hasJourney:
					access?.userId === userId && access?.hasJourney === true,
				hasError:
					access?.userId === userId && access?.hasError === true,
				retry,
			}}
		>
			{children}
		</JourneyAccessContext.Provider>
	);
};

export const useJourneyAccess = () => {
	const value = useContext(JourneyAccessContext);
	if (!value)
		throw new Error(
			'useJourneyAccess must be used within JourneyAccessProvider.',
		);
	return value;
};
