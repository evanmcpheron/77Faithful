import type {
	ICancelCommunityJourneyRequest,
	IConfigureCommunityJourneyRequest,
	IEnrollCommunityJourneyRequest,
	IGetCommunityJourneyEnrollmentRequest,
	IGetCommunityJourneyScheduleRequest,
	IListCommunityJourneyHistoryRequest,
	IReviseCommunityJourneyRequest,
	IWithdrawCommunityJourneyEnrollmentRequest,
} from '../../types/community/community-function.types';
import type { ICommunityJourneyPreview } from '../../types/community/community-journey.types';
import type { IFormationCourseReference } from '../../types/formation/formation-course.types';
import type {
	TCalendarDate,
	TIanaTimeZoneId,
} from '../../types/shared/persistence.types';

export const CommunityJourneyLimits = {
	identifier: 128,
	timeZone: 100,
	defaultPageSize: 10,
	maxPageSize: 20,
	cursor: 512,
} as const;
const idPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid record.');
	return value as Record<string, unknown>;
};
const exactKeys = (value: Record<string, unknown>, keys: string[]) =>
	Object.keys(value).length === keys.length &&
	keys.every((key) => key in value);
const onlyKeys = (value: Record<string, unknown>, keys: string[]) =>
	Object.keys(value).every((key) => keys.includes(key));
const id = (value: unknown): string => {
	if (typeof value !== 'string' || !idPattern.test(value))
		throw new Error('Invalid identifier.');
	return value;
};
const revision = (value: unknown): number => {
	if (
		typeof value !== 'number' ||
		!Number.isSafeInteger(value) ||
		value < 0 ||
		value >= 2_147_483_647
	)
		throw new Error('Invalid revision.');
	return value;
};
export const parseCommunityCalendarDate = (value: unknown): TCalendarDate => {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
		throw new Error('Invalid date.');
	const year = Number(value.slice(0, 4));
	const month = Number(value.slice(5, 7));
	const day = Number(value.slice(8, 10));
	const parsed = new Date(Date.UTC(year, month - 1, day));
	if (
		parsed.getUTCFullYear() !== year ||
		parsed.getUTCMonth() !== month - 1 ||
		parsed.getUTCDate() !== day
	)
		throw new Error('Invalid date.');
	return value as TCalendarDate;
};
export const parseCommunityTimeZoneId = (value: unknown): TIanaTimeZoneId => {
	if (
		typeof value !== 'string' ||
		value.length < 1 ||
		value.length > CommunityJourneyLimits.timeZone ||
		/^[+-]/.test(value) ||
		!/^[A-Za-z0-9_+./-]+$/.test(value)
	)
		throw new Error('Invalid time zone.');
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
	} catch {
		throw new Error('Invalid time zone.');
	}
	return value;
};
const course = (value: unknown): IFormationCourseReference => {
	const input = record(value);
	if (!exactKeys(input, ['courseId', 'courseVersionId']))
		throw new Error('Invalid course.');
	return {
		courseId: id(input['courseId']),
		courseVersionId: id(input['courseVersionId']),
	};
};
export const parseConfigureCommunityJourneyRequest = (
	value: unknown,
): IConfigureCommunityJourneyRequest => {
	const input = record(value);
	if (
		!exactKeys(input, [
			'communityId',
			'course',
			'startDate',
			'timeZoneId',
			'operationId',
		])
	)
		throw new Error('Invalid schedule.');
	return {
		communityId: id(input['communityId']),
		course: course(input['course']),
		startDate: parseCommunityCalendarDate(input['startDate']),
		timeZoneId: parseCommunityTimeZoneId(input['timeZoneId']),
		operationId: id(input['operationId']),
	};
};
export const parseReviseCommunityJourneyRequest = (
	value: unknown,
): IReviseCommunityJourneyRequest => {
	const input = record(value);
	if (
		!exactKeys(input, [
			'communityId',
			'communityJourneyId',
			'expectedRevision',
			'course',
			'startDate',
			'timeZoneId',
			'operationId',
		])
	)
		throw new Error('Invalid revision.');
	return {
		...parseConfigureCommunityJourneyRequest({
			communityId: input['communityId'],
			course: input['course'],
			startDate: input['startDate'],
			timeZoneId: input['timeZoneId'],
			operationId: input['operationId'],
		}),
		communityJourneyId: id(input['communityJourneyId']),
		expectedRevision: revision(input['expectedRevision']),
	};
};
export const parseCancelCommunityJourneyRequest = (
	value: unknown,
): ICancelCommunityJourneyRequest => {
	const input = record(value);
	if (
		!exactKeys(input, [
			'communityId',
			'communityJourneyId',
			'expectedRevision',
			'operationId',
		])
	)
		throw new Error('Invalid cancellation.');
	return {
		communityId: id(input['communityId']),
		communityJourneyId: id(input['communityJourneyId']),
		expectedRevision: revision(input['expectedRevision']),
		operationId: id(input['operationId']),
	};
};
export const parseGetCommunityJourneyScheduleRequest = (
	value: unknown,
): IGetCommunityJourneyScheduleRequest => {
	const input = record(value);
	if (!exactKeys(input, ['communityId']))
		throw new Error('Invalid community.');
	return { communityId: id(input['communityId']) };
};
export const parseGetCommunityJourneyCourseOptionRequest =
	parseGetCommunityJourneyScheduleRequest;
export const parseListCommunityJourneyHistoryRequest = (
	value: unknown,
): IListCommunityJourneyHistoryRequest => {
	const input = record(value);
	if (
		!onlyKeys(input, ['communityId', 'pageSize', 'cursor']) ||
		!('communityId' in input)
	)
		throw new Error('Invalid history page.');
	const pageSize = input['pageSize'];
	const cursor = input['cursor'];
	if (
		pageSize !== undefined &&
		(typeof pageSize !== 'number' ||
			!Number.isInteger(pageSize) ||
			pageSize < 1 ||
			pageSize > CommunityJourneyLimits.maxPageSize)
	)
		throw new Error('Invalid history page.');
	if (
		cursor !== undefined &&
		(typeof cursor !== 'string' ||
			cursor.length < 1 ||
			cursor.length > CommunityJourneyLimits.cursor)
	)
		throw new Error('Invalid cursor.');
	return {
		communityId: id(input['communityId']),
		...(pageSize === undefined ? {} : { pageSize: pageSize as number }),
		...(cursor === undefined ? {} : { cursor: cursor as string }),
	};
};
export const parseCommunityJourneyPreview = (
	value: unknown,
): ICommunityJourneyPreview => {
	const input = record(value);
	if (
		!exactKeys(input, [
			'communityJourneyId',
			'communityId',
			'revision',
			'course',
			'startDate',
			'timeZoneId',
			'status',
			'canEnroll',
			'canRevise',
		]) ||
		!['Scheduled', 'Active', 'Completed', 'Canceled'].includes(
			String(input['status']),
		) ||
		typeof input['canEnroll'] !== 'boolean' ||
		typeof input['canRevise'] !== 'boolean'
	)
		throw new Error('Invalid schedule preview.');
	return {
		communityJourneyId: id(input['communityJourneyId']),
		communityId: id(input['communityId']),
		revision: revision(input['revision']),
		course: course(input['course']),
		startDate: parseCommunityCalendarDate(input['startDate']),
		timeZoneId: parseCommunityTimeZoneId(input['timeZoneId']),
		status: input['status'] as ICommunityJourneyPreview['status'],
		canEnroll: input['canEnroll'],
		canRevise: input['canRevise'],
	};
};

export const parseEnrollCommunityJourneyRequest = (
	value: unknown,
): IEnrollCommunityJourneyRequest => {
	const input = record(value);
	if (
		!exactKeys(input, [
			'communityId',
			'communityJourneyId',
			'expectedCommunityJourneyRevision',
			'setupDraftId',
			'expectedSetupRevision',
			'startingTimeZoneId',
			'consentToScheduledActivation',
			'operationId',
		]) ||
		input['setupDraftId'] !== 'current' ||
		input['consentToScheduledActivation'] !== true
	)
		throw new Error('Invalid enrollment.');
	return {
		communityId: id(input['communityId']),
		communityJourneyId: id(input['communityJourneyId']),
		expectedCommunityJourneyRevision: revision(
			input['expectedCommunityJourneyRevision'],
		),
		setupDraftId: 'current',
		expectedSetupRevision: revision(input['expectedSetupRevision']),
		startingTimeZoneId: parseCommunityTimeZoneId(
			input['startingTimeZoneId'],
		),
		consentToScheduledActivation: true,
		operationId: id(input['operationId']),
	};
};

export const parseWithdrawCommunityJourneyEnrollmentRequest = (
	value: unknown,
): IWithdrawCommunityJourneyEnrollmentRequest => {
	const input = record(value);
	if (!exactKeys(input, ['communityId', 'communityJourneyId', 'operationId']))
		throw new Error('Invalid withdrawal.');
	return {
		communityId: id(input['communityId']),
		communityJourneyId: id(input['communityJourneyId']),
		operationId: id(input['operationId']),
	};
};

export const parseGetCommunityJourneyEnrollmentRequest = (
	value: unknown,
): IGetCommunityJourneyEnrollmentRequest => {
	const input = record(value);
	if (!exactKeys(input, ['communityId', 'communityJourneyId']))
		throw new Error('Invalid enrollment reader.');
	return {
		communityId: id(input['communityId']),
		communityJourneyId: id(input['communityJourneyId']),
	};
};
