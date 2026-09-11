import { app, db } from '@td/services/firebase/firebase.instance';
import type {
	IStartJourneyRequest,
	TStartJourneyResult,
} from '@td/types/journey/journey-function.types';
import { collection, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const createJourneyStartOperationId = (userId: string): string =>
	doc(collection(db, 'users', userId, 'journeyStartOperations')).id;
export const startJourney = async (
	input: IStartJourneyRequest,
): Promise<TStartJourneyResult> => {
	const callable = httpsCallable<IStartJourneyRequest, TStartJourneyResult>(
		getFunctions(app),
		'startJourney',
	);
	return (await callable(input)).data;
};
