import { addJourneyCalendarDays } from '@td/features/journey/journey-calendar';
import { app } from '@td/services/firebase/firebase.instance';
import {
	OptionalPracticeId,
	type TOptionalPracticeSelection,
} from '@td/types/formation/practice.types';
import type {
	ICancelOptionalPracticeReplacementResult,
	IConfirmOptionalPracticeReplacementResult,
} from '@td/types/journey/journey-function.types';
import type { IJourneyPracticeSelection } from '@td/types/journey/practice-change.types';
import type { TCalendarDate } from '@td/types/shared/persistence.types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type {
	ICancelPracticeSettingsRequest,
	IConfirmPracticeSettingsRequest,
	IPracticeSettingsRequest,
	TPracticeSettingsResult,
} from './practice-settings.types';

const invalid = () => new Error('Invalid practice settings response.');
const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw invalid();
	return value as Record<string, unknown>;
};
const parseIds = (value: unknown): TOptionalPracticeSelection => {
	if (
		!Array.isArray(value) ||
		value.length < 2 ||
		value.length > 4 ||
		new Set(value).size !== value.length
	)
		throw invalid();
	const ids = value.map((item: unknown) => {
		const id = Object.values(OptionalPracticeId).find(
			(candidate) => candidate === item,
		);
		if (!id) throw invalid();
		return id;
	});
	if (ids.length === 4) return [ids[0]!, ids[1]!, ids[2]!, ids[3]!];
	if (ids.length === 3) return [ids[0]!, ids[1]!, ids[2]!];
	return [ids[0]!, ids[1]!];
};
const parseDate = (value: unknown): TCalendarDate => {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
		throw invalid();
	const date = new Date(`${value}T12:00:00Z`);
	if (
		!Number.isFinite(date.getTime()) ||
		date.toISOString().slice(0, 10) !== value
	)
		throw invalid();
	return value as TCalendarDate;
};
const parseDay = (value: unknown): number => {
	if (
		typeof value !== 'number' ||
		!Number.isInteger(value) ||
		value < 1 ||
		value > 77
	)
		throw invalid();
	return value;
};
export const parsePracticeSelection = (
	input: unknown,
): IJourneyPracticeSelection => {
	const value = record(input);
	if (
		typeof value['journeyId'] !== 'string' ||
		!/^[a-zA-Z0-9_-]{1,128}$/.test(value['journeyId']) ||
		typeof value['scheduleRevision'] !== 'number' ||
		!Number.isSafeInteger(value['scheduleRevision']) ||
		value['scheduleRevision'] < 0
	)
		throw invalid();
	const pending =
		value['pendingChange'] === null ? null : record(value['pendingChange']);
	if (
		pending &&
		(typeof pending['practiceChangeId'] !== 'string' ||
			!/^[a-zA-Z0-9_-]{1,128}$/.test(pending['practiceChangeId']) ||
			pending['effectiveDayNumber'] === 1)
	)
		throw invalid();
	return {
		journeyId: value['journeyId'],
		scheduleRevision: value['scheduleRevision'],
		currentOptionalPracticeIds: parseIds(
			value['currentOptionalPracticeIds'],
		),
		pendingChange: pending
			? {
					practiceChangeId: String(pending['practiceChangeId']),
					optionalPracticeIds: parseIds(
						pending['optionalPracticeIds'],
					),
					effectiveDayNumber: parseDay(pending['effectiveDayNumber']),
					effectiveDate: parseDate(pending['effectiveDate']),
				}
			: null,
	};
};
export const parsePracticeSettings = (
	input: unknown,
): TPracticeSettingsResult => {
	const value = record(input);
	if (
		value['status'] === 'NoActiveJourney' ||
		value['status'] === 'Completed' ||
		value['status'] === 'NotStarted'
	)
		return { status: value['status'] };
	if (value['status'] !== 'Ready') throw invalid();
	const next = value['nextDay'] === null ? null : record(value['nextDay']);
	const dayNumber = parseDay(value['dayNumber']);
	const calendarDate = parseDate(value['calendarDate']);
	if (
		next &&
		(next['dayNumber'] !== dayNumber + 1 ||
			next['calendarDate'] !== addJourneyCalendarDays(calendarDate, 1))
	)
		throw invalid();
	return {
		status: 'Ready',
		selection: parsePracticeSelection(value['selection']),
		dayNumber,
		calendarDate,
		nextDay: next
			? {
					dayNumber: parseDay(next['dayNumber']),
					calendarDate: parseDate(next['calendarDate']),
				}
			: null,
	};
};
export const loadPracticeSettings = async (observedPhoneTimeZoneId: string) => {
	const call = httpsCallable<IPracticeSettingsRequest, unknown>(
		getFunctions(app),
		'getPracticeSettings',
	);
	return parsePracticeSettings(
		(await call({ observedPhoneTimeZoneId })).data,
	);
};
export const confirmPracticeSettings = async (
	request: IConfirmPracticeSettingsRequest,
) => {
	const call = httpsCallable<
		IConfirmPracticeSettingsRequest,
		IConfirmOptionalPracticeReplacementResult
	>(getFunctions(app), 'confirmOptionalPracticeReplacement');
	const selection = parsePracticeSelection(
		(await call(request)).data.selection,
	);
	if (selection.journeyId !== request.journeyId) throw invalid();
	return selection;
};
export const cancelPracticeSettings = async (
	request: ICancelPracticeSettingsRequest,
) => {
	const call = httpsCallable<
		ICancelPracticeSettingsRequest,
		ICancelOptionalPracticeReplacementResult
	>(getFunctions(app), 'cancelOptionalPracticeReplacement');
	const selection = parsePracticeSelection(
		(await call(request)).data.selection,
	);
	if (selection.journeyId !== request.journeyId) throw invalid();
	return selection;
};
