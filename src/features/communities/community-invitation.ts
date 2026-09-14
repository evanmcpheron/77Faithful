import type {
	IGetCurrentCommunityInvitationRequest,
	IGetCurrentCommunityInvitationResult,
	IIssueCommunityInvitationRequest,
	IIssueCommunityInvitationResult,
	IRevokeCommunityInvitationRequest,
	IRevokeCommunityInvitationResult,
	IRotateCommunityInvitationRequest,
	IRotateCommunityInvitationResult,
} from '../../types/community/community-function.types';
import type { IOrganizerCommunityInvitation } from '../../types/community/community-invitation.types';
import type { IPersistedTimestamp } from '../../types/shared/persistence.types';

export const CommunityInvitationLimits = {
	communityId: 128,
	operationId: 128,
	invitationId: 128,
	codeCharacters: 20,
	formattedCodeLength: 23,
} as const;

const identifierPattern = /^[a-zA-Z0-9_-]+$/;
const invitationCodePattern = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/;
const formattedInvitationCodePattern =
	/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}(?:-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}){3}$/;

const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid community invitation data.');
	return value as Record<string, unknown>;
};

const hasOnlyKeys = (value: Record<string, unknown>, keys: string[]): boolean =>
	Object.keys(value).every((key) => keys.includes(key));

const identifier = (value: unknown, max: number): string => {
	if (
		typeof value !== 'string' ||
		value.length < 1 ||
		value.length > max ||
		!identifierPattern.test(value)
	)
		throw new Error('Invalid community invitation identifier.');
	return value;
};

const communityId = (value: unknown): string =>
	identifier(value, CommunityInvitationLimits.communityId);

const operationId = (value: unknown): string =>
	identifier(value, CommunityInvitationLimits.operationId);

const invitationId = (value: unknown): string =>
	identifier(value, CommunityInvitationLimits.invitationId);

const timestamp = (value: unknown): IPersistedTimestamp => {
	const parsed = record(value);
	if (
		!hasOnlyKeys(parsed, ['seconds', 'nanoseconds']) ||
		typeof parsed['seconds'] !== 'number' ||
		!Number.isSafeInteger(parsed['seconds']) ||
		typeof parsed['nanoseconds'] !== 'number' ||
		!Number.isInteger(parsed['nanoseconds']) ||
		parsed['nanoseconds'] < 0 ||
		parsed['nanoseconds'] > 999_999_999
	)
		throw new Error('Invalid community invitation timestamp.');
	return {
		seconds: parsed['seconds'],
		nanoseconds: parsed['nanoseconds'],
	};
};

export const normalizeCommunityInvitationCode = (value: unknown): string => {
	if (
		typeof value !== 'string' ||
		value.length < CommunityInvitationLimits.codeCharacters ||
		value.length > CommunityInvitationLimits.formattedCodeLength
	)
		throw new Error('Invalid community invitation code.');
	const uppercase = value.toUpperCase();
	if (
		!invitationCodePattern.test(uppercase) &&
		!formattedInvitationCodePattern.test(uppercase)
	)
		throw new Error('Invalid community invitation code.');
	const normalized = uppercase.replace(/-/g, '');
	if (
		normalized.length !== CommunityInvitationLimits.codeCharacters ||
		!invitationCodePattern.test(normalized)
	)
		throw new Error('Invalid community invitation code.');
	return normalized;
};

const parseOrganizerInvitation = (
	value: unknown,
): IOrganizerCommunityInvitation => {
	const invitation = record(value);
	if (
		!hasOnlyKeys(invitation, [
			'communityId',
			'invitationId',
			'code',
			'expiresAt',
		]) ||
		typeof invitation['code'] !== 'string'
	)
		throw new Error('Invalid community invitation response.');
	const code = invitation['code'];
	const normalized = normalizeCommunityInvitationCode(code);
	if (
		code !==
		`${normalized.slice(0, 5)}-${normalized.slice(5, 10)}-${normalized.slice(10, 15)}-${normalized.slice(15)}`
	)
		throw new Error('Invalid community invitation response.');
	return {
		communityId: communityId(invitation['communityId']),
		invitationId: invitationId(invitation['invitationId']),
		code,
		expiresAt: timestamp(invitation['expiresAt']),
	};
};

const parseMutationRequest = (
	value: unknown,
): IIssueCommunityInvitationRequest => {
	const input = record(value);
	if (
		!hasOnlyKeys(input, ['communityId', 'operationId']) ||
		!('communityId' in input) ||
		!('operationId' in input)
	)
		throw new Error('Invalid community invitation request.');
	return {
		communityId: communityId(input['communityId']),
		operationId: operationId(input['operationId']),
	};
};

export const parseIssueCommunityInvitationRequest = (
	value: unknown,
): IIssueCommunityInvitationRequest => parseMutationRequest(value);

export const parseGetCurrentCommunityInvitationRequest = (
	value: unknown,
): IGetCurrentCommunityInvitationRequest => {
	const input = record(value);
	if (!hasOnlyKeys(input, ['communityId']) || !('communityId' in input))
		throw new Error('Invalid community invitation request.');
	return { communityId: communityId(input['communityId']) };
};

export const parseRotateCommunityInvitationRequest = (
	value: unknown,
): IRotateCommunityInvitationRequest => parseMutationRequest(value);

export const parseRevokeCommunityInvitationRequest = (
	value: unknown,
): IRevokeCommunityInvitationRequest => {
	const input = record(value);
	if (
		!hasOnlyKeys(input, ['communityId', 'invitationId', 'operationId']) ||
		!('communityId' in input) ||
		!('invitationId' in input) ||
		!('operationId' in input)
	)
		throw new Error('Invalid community invitation request.');
	return {
		communityId: communityId(input['communityId']),
		invitationId: invitationId(input['invitationId']),
		operationId: operationId(input['operationId']),
	};
};

export const parseIssueCommunityInvitationResult = (
	value: unknown,
): IIssueCommunityInvitationResult => {
	const result = record(value);
	if (!hasOnlyKeys(result, ['invitation']))
		throw new Error('Invalid community invitation response.');
	return { invitation: parseOrganizerInvitation(result['invitation']) };
};

export const parseGetCurrentCommunityInvitationResult = (
	value: unknown,
): IGetCurrentCommunityInvitationResult => {
	const result = record(value);
	if (!hasOnlyKeys(result, ['invitation']))
		throw new Error('Invalid community invitation response.');
	return {
		invitation:
			result['invitation'] === null
				? null
				: parseOrganizerInvitation(result['invitation']),
	};
};

export const parseRotateCommunityInvitationResult = (
	value: unknown,
): IRotateCommunityInvitationResult =>
	parseIssueCommunityInvitationResult(value);

export const parseRevokeCommunityInvitationResult = (
	value: unknown,
): IRevokeCommunityInvitationResult => {
	const result = record(value);
	if (!hasOnlyKeys(result, ['communityId', 'invitationId', 'revokedAt']))
		throw new Error('Invalid community invitation response.');
	return {
		communityId: communityId(result['communityId']),
		invitationId: invitationId(result['invitationId']),
		revokedAt: timestamp(result['revokedAt']),
	};
};
