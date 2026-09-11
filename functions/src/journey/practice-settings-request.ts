import { HttpsError } from 'firebase-functions/v2/https';
import { getJourneyCalendarDate } from '../../generated/features/journey/journey-calendar';
import type {
	ICancelPracticeSettingsRequest,
	IConfirmPracticeSettingsRequest,
	IPracticeSettingsRequest,
} from '../../generated/features/settings/practice-settings.types';
import {
	OptionalPracticeId,
	type TOptionalPracticeSelection,
} from '../../generated/types/formation/practice.types';
import type { TCalendarDate } from '../../generated/types/shared/persistence.types';

const invalid = () =>
	new HttpsError(
		'invalid-argument',
		'Reopen Practices and review your choices.',
	);
export const requirePracticeRecord = (
	input: unknown,
): Record<string, unknown> => {
	if (!input || typeof input !== 'object' || Array.isArray(input))
		throw invalid();
	return input as Record<string, unknown>;
};
const requireId = (input: unknown): string => {
	if (typeof input !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(input))
		throw invalid();
	return input;
};
export const requirePracticeRevision = (input: unknown): number => {
	if (
		typeof input !== 'number' ||
		!Number.isSafeInteger(input) ||
		input < 0 ||
		input >= Number.MAX_SAFE_INTEGER
	)
		throw invalid();
	return input;
};
export const requirePracticeDate = (input: unknown): TCalendarDate => {
	if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input))
		throw invalid();
	const date = new Date(`${input}T12:00:00Z`);
	if (
		!Number.isFinite(date.getTime()) ||
		date.toISOString().slice(0, 10) !== input
	)
		throw invalid();
	return input as TCalendarDate;
};
export const requirePracticeSelection = (
	input: unknown,
): TOptionalPracticeSelection => {
	if (
		!Array.isArray(input) ||
		input.length < 2 ||
		input.length > 4 ||
		new Set(input).size !== input.length
	)
		throw invalid();
	const ids = input.map((value: unknown) => {
		const id = Object.values(OptionalPracticeId).find(
			(candidate) => candidate === value,
		);
		if (!id) throw invalid();
		return id;
	});
	if (ids.length === 4) return [ids[0]!, ids[1]!, ids[2]!, ids[3]!];
	if (ids.length === 3) return [ids[0]!, ids[1]!, ids[2]!];
	return [ids[0]!, ids[1]!];
};
export const parsePracticeSettingsRequest = (
	input: unknown,
): IPracticeSettingsRequest => {
	const request = requirePracticeRecord(input);
	const zone = request.observedPhoneTimeZoneId;
	if (
		typeof zone !== 'string' ||
		!zone ||
		zone.length > 100 ||
		/^[+-]/.test(zone)
	)
		throw invalid();
	try {
		getJourneyCalendarDate(new Date(), zone);
	} catch {
		throw invalid();
	}
	return { observedPhoneTimeZoneId: zone };
};
export const parseConfirmPracticeSettingsRequest = (
	input: unknown,
): IConfirmPracticeSettingsRequest => {
	const request = requirePracticeRecord(input);
	const day = request.reviewedEffectiveDayNumber;
	if (
		typeof day !== 'number' ||
		!Number.isInteger(day) ||
		day < 2 ||
		day > 77
	)
		throw invalid();
	return {
		...parsePracticeSettingsRequest(request),
		journeyId: requireId(request.journeyId),
		operationId: requireId(request.operationId),
		expectedScheduleRevision: requirePracticeRevision(
			request.expectedScheduleRevision,
		),
		optionalPracticeIds: requirePracticeSelection(
			request.optionalPracticeIds,
		),
		reviewedEffectiveDayNumber: day,
		reviewedEffectiveDate: requirePracticeDate(
			request.reviewedEffectiveDate,
		),
	};
};
export const parseCancelPracticeSettingsRequest = (
	input: unknown,
): ICancelPracticeSettingsRequest => {
	const request = requirePracticeRecord(input);
	return {
		...parsePracticeSettingsRequest(request),
		journeyId: requireId(request.journeyId),
		operationId: requireId(request.operationId),
		practiceChangeId: requireId(request.practiceChangeId),
		expectedScheduleRevision: requirePracticeRevision(
			request.expectedScheduleRevision,
		),
	};
};
