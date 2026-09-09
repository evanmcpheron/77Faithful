import { FirebaseError } from 'firebase/app';
import { collection, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { getDeviceId } from '@77/features/account/device-id.service';
import { app, db } from '@77/lib/firebase';
import type { ISetPracticeCompletionResult } from '@77/types/journey/journey-day.types';
import type { ISaveWritingResult } from '@77/types/journey/journey-writing.types';
import type { IParticipantChangeOrigin } from '@77/types/shared/sync.types';

import type {
  ICompleteJourneyPracticeRequest,
  IGetJourneyDayRequest,
  IJourneyDaySession,
  ISaveJourneyReflectionRequest,
} from './journey-day-session.types';

export const loadJourneyDay = httpsCallable<IGetJourneyDayRequest, IJourneyDaySession>(
  getFunctions(app),
  'getJourneyDay',
);
export const setJourneyPracticeCompletion = httpsCallable<
  ICompleteJourneyPracticeRequest,
  ISetPracticeCompletionResult
>(getFunctions(app), 'setJourneyPracticeCompletion');
export const saveJourneyReflection = httpsCallable<
  ISaveJourneyReflectionRequest,
  ISaveWritingResult
>(getFunctions(app), 'saveJourneyReflection');

export const createDailyChangeOrigin = async (): Promise<IParticipantChangeOrigin> => {
  const milliseconds = Date.now();
  return {
    operationId: doc(collection(db, 'dailyOperations')).id,
    deviceId: await getDeviceId(),
    recordedOnDeviceAt: {
      seconds: Math.floor(milliseconds / 1000),
      nanoseconds: (milliseconds % 1000) * 1e6,
    },
  };
};

export const getDailySaveError = (error: unknown): string => {
  if (error instanceof FirebaseError && error.code === 'functions/aborted') return error.message;
  return 'We couldn’t save that change. Check your connection and try again.';
};
