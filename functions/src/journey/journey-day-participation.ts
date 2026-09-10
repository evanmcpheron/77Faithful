import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import type {
	ICompleteJourneyPracticeRequest,
	ISaveJourneyReflectionRequest,
} from '../../generated/features/journey/journey-day-session.types';
import type {
	IPracticeCompletion,
	ISetPracticeCompletionResult,
	TAssignedOptionalPractices,
} from '../../generated/types/journey/journey-day.types';
import type {
	ISaveWritingResult,
	IWritingRevisionDocument,
} from '../../generated/types/journey/journey-writing.types';

import { readJourneyDay, serializeTimestamp } from './journey-day';

export const completeJourneyPracticeForAccount = async (
	userId: string,
	request: ICompleteJourneyPracticeRequest,
	database = getFirestore(),
): Promise<ISetPracticeCompletionResult> => {
	return database.runTransaction(async (transaction) => {
		const operationReference = database.doc(
			`users/${userId}/journeys/${request.journeyId}/dailyOperations/${request.origin.operationId}`,
		);
		const previousOperation = (
			await transaction.get(operationReference)
		).data();
		const fingerprint = JSON.stringify(request);
		if (previousOperation) {
			if (previousOperation.fingerprint !== fingerprint)
				throw new HttpsError(
					'already-exists',
					'Reopen the day before making another change.',
				);
			return previousOperation.result as ISetPracticeCompletionResult;
		}
		const { day, dayReference } = await readJourneyDay(
			transaction,
			database,
			userId,
			request,
		);
		const foundationalKey =
			request.practiceId === 'ReadScripture'
				? 'readScripture'
				: request.practiceId === 'Pray'
					? 'pray'
					: request.practiceId === 'Reflect'
						? 'reflect'
						: null;
		const currentCompletion = foundationalKey
			? day.practices[foundationalKey]
			: day.practices.optionalPractices.find(
					(practice) => practice.practiceId === request.practiceId,
				)?.completion;
		if (!currentCompletion)
			throw new HttpsError(
				'failed-precondition',
				'This practice isn’t assigned to this day.',
			);
		if (currentCompletion.revision !== request.expectedCompletionRevision) {
			throw new HttpsError(
				'aborted',
				'This practice changed on another device. Reopen the day before updating it.',
			);
		}
		const now = Timestamp.now();
		const completion: IPracticeCompletion = {
			status: request.isComplete ? 'Complete' : 'NotMarked',
			revision: currentCompletion.revision + 1,
			updatedAt: now,
		};
		const updateOptional = (
			practice: TAssignedOptionalPractices[number],
		) => ({
			practiceId: practice.practiceId,
			completion:
				practice.practiceId === request.practiceId
					? completion
					: practice.completion,
		});
		const assigned = day.practices.optionalPractices;
		const optionalPractices: TAssignedOptionalPractices =
			assigned.length === 4
				? [
						updateOptional(assigned[0]),
						updateOptional(assigned[1]),
						updateOptional(assigned[2]),
						updateOptional(assigned[3]),
					]
				: assigned.length === 3
					? [
							updateOptional(assigned[0]),
							updateOptional(assigned[1]),
							updateOptional(assigned[2]),
						]
					: [
							updateOptional(assigned[0]),
							updateOptional(assigned[1]),
						];
		transaction.set(dayReference, {
			...day,
			practices: {
				...day.practices,
				...(foundationalKey ? { [foundationalKey]: completion } : {}),
				optionalPractices,
			},
			updatedAt: now,
			lastParticipantUpdateAt: now,
		});
		const result: ISetPracticeCompletionResult = {
			journeyId: request.journeyId,
			dayNumber: request.dayNumber,
			practiceId: request.practiceId,
			completion: { ...completion, updatedAt: serializeTimestamp(now) },
		};
		transaction.create(operationReference, { fingerprint, result });
		return result;
	});
};

export const saveJourneyReflectionForAccount = async (
	userId: string,
	request: ISaveJourneyReflectionRequest,
	database = getFirestore(),
): Promise<ISaveWritingResult> => {
	return database.runTransaction(async (transaction) => {
		const journeyPath = `users/${userId}/journeys/${request.target.journeyId}`;
		const operationReference = database.doc(
			`${journeyPath}/dailyOperations/${request.origin.operationId}`,
		);
		const previousOperation = (
			await transaction.get(operationReference)
		).data();
		const fingerprint = JSON.stringify(request);
		if (previousOperation) {
			if (previousOperation.fingerprint !== fingerprint)
				throw new HttpsError(
					'already-exists',
					'Reopen your reflection before saving again.',
				);
			return previousOperation.result as ISaveWritingResult;
		}
		const { day, dayReference } = await readJourneyDay(
			transaction,
			database,
			userId,
			{
				...request.target,
				observedPhoneTimeZoneId: request.observedPhoneTimeZoneId,
			},
		);
		if (
			(day.reflection?.revisionId ?? null) !== request.expectedRevisionId
		) {
			throw new HttpsError(
				'aborted',
				'Your saved reflection changed on another device. Your draft is still here; reopen the day to review the saved version.',
			);
		}
		const now = Timestamp.now();
		const revisionId = request.origin.operationId;
		const revision: IWritingRevisionDocument = {
			userId,
			target: request.target,
			baseRevisionId: request.expectedRevisionId,
			text: request.text,
			origin: {
				...request.origin,
				recordedOnDeviceAt: new Timestamp(
					request.origin.recordedOnDeviceAt.seconds,
					request.origin.recordedOnDeviceAt.nanoseconds,
				),
			},
			savedAt: now,
		};
		const currentWriting = {
			revisionId,
			text: request.text,
			updatedAt: now,
		};
		transaction.create(
			database.doc(`${journeyPath}/writingRevisions/${revisionId}`),
			revision,
		);
		transaction.set(dayReference, {
			...day,
			reflection: currentWriting,
			updatedAt: now,
			lastParticipantUpdateAt: now,
		});
		const result: ISaveWritingResult = {
			savedRevisionId: revisionId,
			currentWriting: {
				...currentWriting,
				updatedAt: serializeTimestamp(now),
			},
			conflictId: null,
		};
		transaction.create(operationReference, { fingerprint, result });
		return result;
	});
};
