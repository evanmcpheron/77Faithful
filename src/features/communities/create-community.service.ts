import { app, db } from '@td/services/firebase/firebase.instance';
import type { ICreateCommunityRequest } from '@td/types/community/community-function.types';
import { collection, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	parseCreateCommunityRequest,
	parseCreateCommunityResult,
} from './community-creation';

export const createCommunityOperationId = (): string =>
	doc(collection(db, 'communities')).id;
export const createCommunity = async (input: ICreateCommunityRequest) => {
	const callable = httpsCallable<ICreateCommunityRequest, unknown>(
		getFunctions(app),
		'createCommunity',
	);
	return parseCreateCommunityResult(
		(await callable(parseCreateCommunityRequest(input))).data,
	);
};
