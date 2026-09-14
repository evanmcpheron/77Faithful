import { clearDaySessions } from '@td/features/journey/journey-day-cache';
import { useAuth } from '@td/providers/auth/auth.hook';
import { db } from '@td/services/firebase/firebase.instance';
import type {
	IJourneyDetails,
	IJourneyDocument,
} from '@td/types/journey/journey.types';
import { JourneyStatus } from '@td/types/journey/journey.types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react';

interface IJourneyAccessState {
	activeJourney:
		Pick<IJourneyDetails, 'journeyId' | 'journey'> | null | undefined;
	userId: string;
	hasJourney: boolean;
	hasError: boolean;
}
interface IJourneyAccessContext {
	// Undefined until the server resolves active-journey presence; null means none.
	activeJourney: IJourneyAccessState['activeJourney'];
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
		let journeyFingerprint: string | undefined;
		const fail = () => {
			if (!isCurrent) return;
			clearDaySessions();
			setAccess({
				userId,
				hasJourney: false,
				hasError: true,
				activeJourney: undefined,
			});
		};
		const journeyQuery = query(
			collection(db, 'users', userId, 'journeys'),
			where('state.status', 'in', Object.values(JourneyStatus)),
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
				const journeys = snapshot.docs.map((document) => ({
					journeyId: document.id,
					journey: document.data() as IJourneyDocument,
				}));
				if (
					journeys.some(
						({ journey }) =>
							journey.userId !== userId ||
							!Object.values(JourneyStatus).includes(
								journey.state?.status,
							),
					)
				) {
					fail();
					return;
				}
				const fingerprint = JSON.stringify(
					journeys.map(({ journeyId, journey }) => [
						journeyId,
						journey.state,
						journey.course,
						journey.startDate,
						journey.practiceScheduleRevision,
					]),
				);
				const changed = fingerprint !== journeyFingerprint;
				journeyFingerprint = fingerprint;
				if (changed) clearDaySessions();
				setAccess((previous) => {
					if (
						!changed &&
						previous?.userId === userId &&
						!previous.hasError &&
						(snapshot.metadata.fromCache ||
							previous.activeJourney !== undefined)
					)
						return previous;
					return {
						userId,
						hasJourney: !snapshot.empty,
						hasError: false,
						activeJourney: snapshot.metadata.fromCache
							? undefined
							: (journeys.find(
									({ journey }) =>
										journey.state.status ===
										JourneyStatus.Active,
								) ?? null),
					};
				});
			},
			fail,
		);
		return () => {
			isCurrent = false;
			unsubscribe();
		};
	}, [userId, retryCount]);

	const retry = () => {
		clearDaySessions();
		setAccess(null);
		setRetryCount((count) => count + 1);
	};
	return (
		<JourneyAccessContext.Provider
			value={{
				activeJourney:
					access?.userId === userId
						? access?.activeJourney
						: undefined,
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
