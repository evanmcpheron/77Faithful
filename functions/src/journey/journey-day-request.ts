import { HttpsError } from 'firebase-functions/v2/https';

import { getJourneyCalendarDate } from '../../generated/features/journey/journey-calendar';
import type {
  ICompleteJourneyPracticeRequest,
  IGetJourneyDayRequest,
  ISaveJourneyReflectionRequest,
} from '../../generated/features/journey/journey-day-session.types';
import {
  FoundationalPracticeId,
  OptionalPracticeId,
} from '../../generated/types/formation/practice.types';
import type { TPracticeId } from '../../generated/types/formation/practice.types';
import type { IParticipantChangeOrigin } from '../../generated/types/shared/sync.types';

const invalidRequest = () => new HttpsError('invalid-argument', 'Reopen the day and try again.');

const requireRecord = (input: unknown): Record<string, unknown> => {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw invalidRequest();
  return input as Record<string, unknown>;
};

const requireId = (input: unknown): string => {
  if (typeof input !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(input)) throw invalidRequest();
  return input;
};

const parseOrigin = (input: unknown): IParticipantChangeOrigin => {
  const origin = requireRecord(input);
  const timestamp = requireRecord(origin.recordedOnDeviceAt);
  if (
    typeof timestamp.seconds !== 'number' ||
    !Number.isSafeInteger(timestamp.seconds) ||
    timestamp.seconds < 0 ||
    typeof timestamp.nanoseconds !== 'number' ||
    !Number.isInteger(timestamp.nanoseconds) ||
    timestamp.nanoseconds < 0 ||
    timestamp.nanoseconds >= 1e9
  )
    throw invalidRequest();
  return {
    operationId: requireId(origin.operationId),
    deviceId: requireId(origin.deviceId),
    recordedOnDeviceAt: { seconds: timestamp.seconds, nanoseconds: timestamp.nanoseconds },
  };
};

export const parseGetJourneyDayRequest = (input: unknown): IGetJourneyDayRequest => {
  const request = requireRecord(input);
  if (
    typeof request.dayNumber !== 'number' ||
    !Number.isInteger(request.dayNumber) ||
    request.dayNumber < 1 ||
    request.dayNumber > 77 ||
    typeof request.observedPhoneTimeZoneId !== 'string' ||
    request.observedPhoneTimeZoneId.length > 100 ||
    /^[+-]/.test(request.observedPhoneTimeZoneId)
  )
    throw invalidRequest();
  try {
    getJourneyCalendarDate(new Date(), request.observedPhoneTimeZoneId);
  } catch {
    throw invalidRequest();
  }
  return {
    journeyId: requireId(request.journeyId),
    dayNumber: request.dayNumber,
    observedPhoneTimeZoneId: request.observedPhoneTimeZoneId,
  };
};

export const parseCompleteJourneyPracticeRequest = (
  input: unknown,
): ICompleteJourneyPracticeRequest => {
  const request = requireRecord(input);
  const practices: readonly TPracticeId[] = [
    ...Object.values(FoundationalPracticeId),
    ...Object.values(OptionalPracticeId),
  ];
  const practiceId = practices.find((practice) => practice === request.practiceId);
  if (
    !practiceId ||
    typeof request.isComplete !== 'boolean' ||
    typeof request.expectedCompletionRevision !== 'number' ||
    !Number.isSafeInteger(request.expectedCompletionRevision) ||
    request.expectedCompletionRevision < 0
  )
    throw invalidRequest();
  return {
    ...parseGetJourneyDayRequest(request),
    practiceId,
    isComplete: request.isComplete,
    expectedCompletionRevision: request.expectedCompletionRevision,
    origin: parseOrigin(request.origin),
  };
};

export const parseSaveJourneyReflectionRequest = (
  input: unknown,
): ISaveJourneyReflectionRequest => {
  const request = requireRecord(input);
  const target = requireRecord(request.target);
  const dayRequest = parseGetJourneyDayRequest({
    ...target,
    observedPhoneTimeZoneId: request.observedPhoneTimeZoneId,
  });
  if (
    target.kind !== 'DailyReflection' ||
    typeof request.text !== 'string' ||
    request.text.length > 10000
  ) {
    throw invalidRequest();
  }
  return {
    target: {
      kind: 'DailyReflection',
      journeyId: dayRequest.journeyId,
      dayNumber: dayRequest.dayNumber,
    },
    observedPhoneTimeZoneId: dayRequest.observedPhoneTimeZoneId,
    expectedRevisionId:
      request.expectedRevisionId === null ? null : requireId(request.expectedRevisionId),
    text: request.text,
    origin: parseOrigin(request.origin),
  };
};
