import { getDeviceId } from '@td/features/account/device-id.service';
import { app, db } from '@td/services/firebase/firebase.instance';
import type { ISaveWritingResult } from '@td/types/journey/journey-writing.types';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { ISaveJourneyReflectionRequest } from './journey-day-session.types';

export const saveJourneyReflection = async (
	input: Omit<
		ISaveJourneyReflectionRequest,
		'origin' | 'observedPhoneTimeZoneId'
	>,
): Promise<ISaveWritingResult> => {
	const timestamp = Timestamp.now();
	const callable = httpsCallable<
		ISaveJourneyReflectionRequest,
		ISaveWritingResult
	>(getFunctions(app), 'saveJourneyReflection');
	const { data } = await callable({
		...input,
		observedPhoneTimeZoneId:
			Intl.DateTimeFormat().resolvedOptions().timeZone,
		origin: {
			operationId: doc(collection(db, 'operationIds')).id,
			deviceId: await getDeviceId(),
			recordedOnDeviceAt: {
				seconds: timestamp.seconds,
				nanoseconds: timestamp.nanoseconds,
			},
		},
	});
	if (
		typeof data.savedRevisionId !== 'string' ||
		!data.savedRevisionId ||
		data.conflictId !== null ||
		data.currentWriting?.revisionId !== data.savedRevisionId ||
		data.currentWriting.text !== input.text
	) {
		throw new Error('Reflection save was not confirmed.');
	}
	return data;
};
