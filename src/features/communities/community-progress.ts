import type {
	IGetCommunityAggregateProgressRequest,
	IGetCommunityProgressSharingRequest,
	IListSharedCommunityProgressRequest,
	ISetCommunityProgressSharingRequest,
} from '../../types/community/community-progress.types';

export const CommunityProgressLimits = {
	identifier: 128,
	cursor: 512,
	defaultPageSize: 20,
	maxPageSize: 50,
} as const;

const identifierPattern = /^[A-Za-z0-9_-]{1,128}$/;
const inputRecord = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid progress input.');
	return value as Record<string, unknown>;
};
const exactKeys = (record: Record<string, unknown>, keys: string[]) => {
	if (
		Object.keys(record).length !== keys.length ||
		!keys.every((key) => Object.prototype.hasOwnProperty.call(record, key))
	)
		throw new Error('Unexpected progress input field.');
};
const onlyKeys = (record: Record<string, unknown>, keys: string[]) => {
	if (!Object.keys(record).every((key) => keys.includes(key)))
		throw new Error('Unexpected progress input field.');
};
const identifier = (value: unknown): string => {
	if (typeof value !== 'string' || !identifierPattern.test(value))
		throw new Error('Invalid progress identifier.');
	return value;
};
const scope = (record: Record<string, unknown>) => ({
	communityId: identifier(record['communityId']),
	communityJourneyId: identifier(record['communityJourneyId']),
});

export const parseGetCommunityProgressSharingRequest = (
	value: unknown,
): IGetCommunityProgressSharingRequest => {
	const record = inputRecord(value);
	exactKeys(record, ['communityId', 'communityJourneyId']);
	return scope(record);
};

export const parseSetCommunityProgressSharingRequest = (
	value: unknown,
): ISetCommunityProgressSharingRequest => {
	const record = inputRecord(value);
	exactKeys(record, [
		'communityId',
		'communityJourneyId',
		'shouldShareIndividualProgress',
		'shouldContributeToAggregateProgress',
		'operationId',
	]);
	if (
		typeof record['shouldShareIndividualProgress'] !== 'boolean' ||
		typeof record['shouldContributeToAggregateProgress'] !== 'boolean'
	)
		throw new Error('Invalid progress choices.');
	return {
		...scope(record),
		shouldShareIndividualProgress: record['shouldShareIndividualProgress'],
		shouldContributeToAggregateProgress:
			record['shouldContributeToAggregateProgress'],
		operationId: identifier(record['operationId']),
	};
};

export const parseListSharedCommunityProgressRequest = (
	value: unknown,
): IListSharedCommunityProgressRequest => {
	const record = inputRecord(value);
	onlyKeys(record, [
		'communityId',
		'communityJourneyId',
		'pageSize',
		'cursor',
	]);
	const result: IListSharedCommunityProgressRequest = scope(record);
	if (record['pageSize'] !== undefined) {
		if (
			typeof record['pageSize'] !== 'number' ||
			!Number.isInteger(record['pageSize']) ||
			record['pageSize'] < 1 ||
			record['pageSize'] > CommunityProgressLimits.maxPageSize
		)
			throw new Error('Invalid progress page size.');
		result.pageSize = record['pageSize'];
	}
	if (record['cursor'] !== undefined) {
		if (
			typeof record['cursor'] !== 'string' ||
			record['cursor'].length < 1 ||
			record['cursor'].length > CommunityProgressLimits.cursor ||
			!/^[A-Za-z0-9_-]+$/.test(record['cursor'])
		)
			throw new Error('Invalid progress cursor.');
		result.cursor = record['cursor'];
	}
	return result;
};

export const parseGetCommunityAggregateProgressRequest = (
	value: unknown,
): IGetCommunityAggregateProgressRequest =>
	parseGetCommunityProgressSharingRequest(value);
