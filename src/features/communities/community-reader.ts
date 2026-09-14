import type {
	IGetCommunityContextRequest,
	IGetCommunityContextResult,
	IListCommunitiesPageRequest,
	IListCommunitiesPageResult,
	IListCommunityMembersRequest,
	IListCommunityMembersResult,
} from '../../types/community/community-function.types';
import type { ICommunityMemberSummary } from '../../types/community/community-membership.types';
import { parseCreateCommunityResult } from './community-creation';

export const CommunityReaderLimits = {
	defaultPageSize: 20,
	maxPageSize: 50,
	maxCursorLength: 512,
	memberCount: 500,
} as const;

const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid community reader data.');
	return value as Record<string, unknown>;
};

const hasOnlyKeys = (value: Record<string, unknown>, keys: string[]): boolean =>
	Object.keys(value).every((key) => keys.includes(key));

const communityId = (value: unknown): string => {
	if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value))
		throw new Error('Invalid community ID.');
	return value;
};

const cursor = (value: unknown): string | undefined => {
	if (value === undefined) return undefined;
	if (
		typeof value !== 'string' ||
		value.length < 1 ||
		value.length > CommunityReaderLimits.maxCursorLength ||
		!/^[a-zA-Z0-9_-]+$/.test(value)
	)
		throw new Error('Invalid community cursor.');
	return value;
};

const pageSize = (value: unknown): number => {
	if (value === undefined) return CommunityReaderLimits.defaultPageSize;
	if (
		typeof value !== 'number' ||
		!Number.isInteger(value) ||
		value < 1 ||
		value > CommunityReaderLimits.maxPageSize
	)
		throw new Error('Invalid community page size.');
	return value;
};

export const parseGetCommunityContextRequest = (
	value: unknown,
): IGetCommunityContextRequest => {
	const input = record(value);
	if (!hasOnlyKeys(input, ['communityId']) || !('communityId' in input))
		throw new Error('Invalid community context request.');
	return { communityId: communityId(input['communityId']) };
};

export const parseListCommunitiesPageRequest = (
	value: unknown,
): IListCommunitiesPageRequest => {
	const input = value == null ? {} : record(value);
	if (!hasOnlyKeys(input, ['pageSize', 'cursor']))
		throw new Error('Invalid community list request.');
	const parsedCursor = cursor(input['cursor']);
	return {
		pageSize: pageSize(input['pageSize']),
		...(parsedCursor === undefined ? {} : { cursor: parsedCursor }),
	};
};

export const parseListCommunityMembersRequest = (
	value: unknown,
): IListCommunityMembersRequest => {
	const input = record(value);
	if (
		!hasOnlyKeys(input, ['communityId', 'pageSize', 'cursor']) ||
		!('communityId' in input)
	)
		throw new Error('Invalid community member list request.');
	const parsedCursor = cursor(input['cursor']);
	return {
		communityId: communityId(input['communityId']),
		pageSize: pageSize(input['pageSize']),
		...(parsedCursor === undefined ? {} : { cursor: parsedCursor }),
	};
};

const parseMember = (value: unknown): ICommunityMemberSummary => {
	const member = record(value);
	if (
		!hasOnlyKeys(member, [
			'communityId',
			'userId',
			'displayName',
			'role',
		]) ||
		typeof member['userId'] !== 'string' ||
		member['userId'].length < 1 ||
		member['userId'].length > 128 ||
		member['userId'].includes('/') ||
		typeof member['displayName'] !== 'string' ||
		member['displayName'].length > 80 ||
		(member['role'] !== 'Organizer' && member['role'] !== 'Member')
	)
		throw new Error('Invalid community member response.');
	return {
		communityId: communityId(member['communityId']),
		userId: member['userId'],
		displayName: member['displayName'].trim(),
		role: member['role'],
	};
};

const parseNextCursor = (value: unknown): string | null => {
	if (value === null) return null;
	const parsed = cursor(value);
	if (parsed === undefined) throw new Error('Invalid community cursor.');
	return parsed;
};

export const parseGetCommunityContextResult = (
	value: unknown,
): IGetCommunityContextResult => {
	const result = record(value);
	const context = record(result['context']);
	const membership = record(context['membership']);
	const capabilities = record(context['capabilities']);
	const activeMemberCount = record(context['activeMemberCount']);
	const capabilityKeys = [
		'canReadMembers',
		'canCreatePost',
		'canInviteMembers',
		'canManageMembers',
		'canEditCommunity',
		'canCloseCommunity',
		'canLeaveCommunity',
	];
	if (
		!hasOnlyKeys(result, ['context']) ||
		!hasOnlyKeys(context, [
			'community',
			'membership',
			'capabilities',
			'activeMemberCount',
		]) ||
		membership['status'] !== 'Active' ||
		!hasOnlyKeys(membership, [
			'communityId',
			'userId',
			'displayName',
			'role',
			'status',
		]) ||
		!hasOnlyKeys(capabilities, capabilityKeys) ||
		!capabilityKeys.every(
			(key) => typeof capabilities[key] === 'boolean',
		) ||
		!hasOnlyKeys(activeMemberCount, ['value', 'isExact']) ||
		typeof activeMemberCount['value'] !== 'number' ||
		!Number.isInteger(activeMemberCount['value']) ||
		activeMemberCount['value'] < 0 ||
		activeMemberCount['value'] > CommunityReaderLimits.memberCount ||
		typeof activeMemberCount['isExact'] !== 'boolean'
	)
		throw new Error('Invalid community context response.');
	const parsedCommunity = parseCreateCommunityResult({
		community: context['community'],
	}).community;
	const parsedMembership = parseMember({
		communityId: membership['communityId'],
		userId: membership['userId'],
		displayName: membership['displayName'],
		role: membership['role'],
	});
	if (parsedMembership.communityId !== parsedCommunity.communityId)
		throw new Error('Invalid community context response.');
	return {
		context: {
			community: parsedCommunity,
			membership: { ...parsedMembership, status: 'Active' },
			capabilities: {
				canReadMembers: capabilities['canReadMembers'] as boolean,
				canCreatePost: capabilities['canCreatePost'] as boolean,
				canInviteMembers: capabilities['canInviteMembers'] as boolean,
				canManageMembers: capabilities['canManageMembers'] as boolean,
				canEditCommunity: capabilities['canEditCommunity'] as boolean,
				canCloseCommunity: capabilities['canCloseCommunity'] as boolean,
				canLeaveCommunity: capabilities['canLeaveCommunity'] as boolean,
			},
			activeMemberCount: {
				value: activeMemberCount['value'],
				isExact: activeMemberCount['isExact'],
			},
		},
	};
};

export const parseListCommunitiesPageResult = (
	value: unknown,
): IListCommunitiesPageResult => {
	const result = record(value);
	if (
		!hasOnlyKeys(result, ['communities', 'nextCursor']) ||
		!Array.isArray(result['communities']) ||
		result['communities'].length > CommunityReaderLimits.maxPageSize
	)
		throw new Error('Invalid community list response.');
	return {
		communities: result['communities'].map(
			(community) => parseCreateCommunityResult({ community }).community,
		),
		nextCursor: parseNextCursor(result['nextCursor']),
	};
};

export const parseListCommunityMembersResult = (
	value: unknown,
): IListCommunityMembersResult => {
	const result = record(value);
	if (
		!hasOnlyKeys(result, ['members', 'nextCursor']) ||
		!Array.isArray(result['members']) ||
		result['members'].length > CommunityReaderLimits.maxPageSize
	)
		throw new Error('Invalid community member list response.');
	return {
		members: result['members'].map(parseMember),
		nextCursor: parseNextCursor(result['nextCursor']),
	};
};
