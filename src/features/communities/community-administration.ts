import type {
	ICloseCommunityRequest,
	ICloseCommunityResult,
	ILeaveCommunityRequest,
	ILeaveCommunityResult,
	IRemoveCommunityMemberRequest,
	IRemoveCommunityMemberResult,
	ITransferCommunityOrganizerRequest,
	ITransferCommunityOrganizerResult,
	IUpdateCommunityRequest,
	IUpdateCommunityResult,
} from '../../types/community/community-function.types';
import type { IPersistedTimestamp } from '../../types/shared/persistence.types';
import {
	CommunityCreationLimits,
	parseCreateCommunityResult,
} from './community-creation';

export const CommunityAdministrationLimits = {
	identifier: 128,
	privateRemovalReason: 1000,
	maxRevision: 2_147_483_646,
} as const;

const identifierPattern = /^[a-zA-Z0-9_-]+$/;
const controlCharacterPattern = /[\u0000-\u001f\u007f]/;

const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid community administration data.');
	return value as Record<string, unknown>;
};

const hasExactKeys = (
	value: Record<string, unknown>,
	keys: readonly string[],
): boolean =>
	Object.keys(value).length === keys.length &&
	keys.every((key) => key in value);

const identifier = (value: unknown): string => {
	if (
		typeof value !== 'string' ||
		value.length < 1 ||
		value.length > CommunityAdministrationLimits.identifier ||
		!identifierPattern.test(value)
	)
		throw new Error('Invalid community administration identifier.');
	return value;
};

const revision = (value: unknown): number => {
	if (
		typeof value !== 'number' ||
		!Number.isInteger(value) ||
		value < 0 ||
		value > CommunityAdministrationLimits.maxRevision
	)
		throw new Error('Invalid community revision.');
	return value;
};

const text = (
	value: unknown,
	maximumLength: number,
	required: boolean,
): string => {
	if (typeof value !== 'string')
		throw new Error('Invalid community administration text.');
	const normalized = value.trim();
	if (
		(required && normalized.length === 0) ||
		normalized.length > maximumLength ||
		controlCharacterPattern.test(normalized)
	)
		throw new Error('Invalid community administration text.');
	return normalized;
};

const timestamp = (value: unknown): IPersistedTimestamp => {
	const parsed = record(value);
	if (
		!hasExactKeys(parsed, ['seconds', 'nanoseconds']) ||
		typeof parsed['seconds'] !== 'number' ||
		!Number.isSafeInteger(parsed['seconds']) ||
		typeof parsed['nanoseconds'] !== 'number' ||
		!Number.isInteger(parsed['nanoseconds']) ||
		parsed['nanoseconds'] < 0 ||
		parsed['nanoseconds'] > 999_999_999
	)
		throw new Error('Invalid community administration timestamp.');
	return {
		seconds: parsed['seconds'],
		nanoseconds: parsed['nanoseconds'],
	};
};

const parseCommunityOperationRequest = (
	value: unknown,
): { communityId: string; operationId: string } => {
	const input = record(value);
	if (!hasExactKeys(input, ['communityId', 'operationId']))
		throw new Error('Invalid community administration request.');
	return {
		communityId: identifier(input['communityId']),
		operationId: identifier(input['operationId']),
	};
};

export const parseUpdateCommunityRequest = (
	value: unknown,
): IUpdateCommunityRequest => {
	const input = record(value);
	if (
		!hasExactKeys(input, [
			'communityId',
			'name',
			'purpose',
			'settings',
			'expectedRevision',
			'operationId',
		])
	)
		throw new Error('Invalid community update request.');
	const settings = record(input['settings']);
	if (
		!Object.keys(settings).every(
			(key) => key === 'participationExpectations',
		)
	)
		throw new Error('Invalid community settings.');
	return {
		communityId: identifier(input['communityId']),
		name: text(input['name'], CommunityCreationLimits.name, true),
		purpose: text(input['purpose'], CommunityCreationLimits.purpose, false),
		settings:
			'participationExpectations' in settings
				? {
						participationExpectations: text(
							settings['participationExpectations'],
							CommunityCreationLimits.participationExpectations,
							false,
						),
					}
				: {},
		expectedRevision: revision(input['expectedRevision']),
		operationId: identifier(input['operationId']),
	};
};

export const parseLeaveCommunityRequest = (
	value: unknown,
): ILeaveCommunityRequest => parseCommunityOperationRequest(value);

export const parseRemoveCommunityMemberRequest = (
	value: unknown,
): IRemoveCommunityMemberRequest => {
	const input = record(value);
	if (
		!hasExactKeys(input, [
			'communityId',
			'memberUserId',
			'privateReason',
			'operationId',
		])
	)
		throw new Error('Invalid community member removal request.');
	return {
		communityId: identifier(input['communityId']),
		memberUserId: identifier(input['memberUserId']),
		privateReason: text(
			input['privateReason'],
			CommunityAdministrationLimits.privateRemovalReason,
			true,
		),
		operationId: identifier(input['operationId']),
	};
};

export const parseTransferCommunityOrganizerRequest = (
	value: unknown,
): ITransferCommunityOrganizerRequest => {
	const input = record(value);
	if (
		!hasExactKeys(input, [
			'communityId',
			'nextOrganizerUserId',
			'expectedRevision',
			'operationId',
		])
	)
		throw new Error('Invalid organizer transfer request.');
	return {
		communityId: identifier(input['communityId']),
		nextOrganizerUserId: identifier(input['nextOrganizerUserId']),
		expectedRevision: revision(input['expectedRevision']),
		operationId: identifier(input['operationId']),
	};
};

export const parseCloseCommunityRequest = (
	value: unknown,
): ICloseCommunityRequest => {
	const input = record(value);
	if (
		!hasExactKeys(input, ['communityId', 'expectedRevision', 'operationId'])
	)
		throw new Error('Invalid community closure request.');
	return {
		communityId: identifier(input['communityId']),
		expectedRevision: revision(input['expectedRevision']),
		operationId: identifier(input['operationId']),
	};
};

export const parseUpdateCommunityResult = (
	value: unknown,
): IUpdateCommunityResult => parseCreateCommunityResult(value);

const parseLifecycleResult = (
	value: unknown,
	keys: readonly string[],
	timestampKey: 'leftAt' | 'removedAt' | 'closedAt',
): Record<string, unknown> => {
	const result = record(value);
	if (!hasExactKeys(result, keys))
		throw new Error('Invalid community administration result.');
	return {
		...result,
		communityId: identifier(result['communityId']),
		[timestampKey]: timestamp(result[timestampKey]),
	};
};

export const parseLeaveCommunityResult = (
	value: unknown,
): ILeaveCommunityResult => {
	const result = parseLifecycleResult(
		value,
		['communityId', 'leftAt'],
		'leftAt',
	);
	return {
		communityId: result['communityId'] as string,
		leftAt: result['leftAt'] as IPersistedTimestamp,
	};
};

export const parseRemoveCommunityMemberResult = (
	value: unknown,
): IRemoveCommunityMemberResult => {
	const result = parseLifecycleResult(
		value,
		['communityId', 'memberUserId', 'removedAt'],
		'removedAt',
	);
	return {
		communityId: result['communityId'] as string,
		memberUserId: identifier(result['memberUserId']),
		removedAt: result['removedAt'] as IPersistedTimestamp,
	};
};

export const parseTransferCommunityOrganizerResult = (
	value: unknown,
): ITransferCommunityOrganizerResult => parseCreateCommunityResult(value);

export const parseCloseCommunityResult = (
	value: unknown,
): ICloseCommunityResult => {
	const result = parseLifecycleResult(
		value,
		['communityId', 'closedAt'],
		'closedAt',
	);
	return {
		communityId: result['communityId'] as string,
		closedAt: result['closedAt'] as IPersistedTimestamp,
	};
};
