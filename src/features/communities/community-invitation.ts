import type {
	IAcceptCommunityInvitationRequest,
	IAcceptCommunityInvitationResult,
	IGetCurrentCommunityInvitationRequest,
	IGetCurrentCommunityInvitationResult,
	IIssueCommunityInvitationRequest,
	IIssueCommunityInvitationResult,
	IPreviewCommunityInvitationRequest,
	IPreviewCommunityInvitationResult,
	IRevokeCommunityInvitationRequest,
	IRevokeCommunityInvitationResult,
	IRotateCommunityInvitationRequest,
	IRotateCommunityInvitationResult,
} from '../../types/community/community-function.types';
import type {
	ICommunityInvitationJourneyPreview,
	ICommunityInvitationPreview,
	IOrganizerCommunityInvitation,
} from '../../types/community/community-invitation.types';
import type { ICommunityMemberSummary } from '../../types/community/community-membership.types';
import type { IPersistedTimestamp } from '../../types/shared/persistence.types';
import { parseCreateCommunityResult } from './community-creation';

export const CommunityInvitationLimits = {
	communityId: 128,
	operationId: 128,
	invitationId: 128,
	codeCharacters: 20,
	formattedCodeLength: 23,
	displayName: 80,
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

const isIdentifier = (value: unknown, max: number): value is string =>
	typeof value === 'string' &&
	value.length >= 1 &&
	value.length <= max &&
	identifierPattern.test(value);

const identifier = (value: unknown, max: number): string => {
	if (!isIdentifier(value, max))
		throw new Error('Invalid community invitation identifier.');
	return value;
};

const communityId = (value: unknown): string =>
	identifier(value, CommunityInvitationLimits.communityId);

const operationId = (value: unknown): string =>
	identifier(value, CommunityInvitationLimits.operationId);

const invitationId = (value: unknown): string =>
	identifier(value, CommunityInvitationLimits.invitationId);

const displayName = (value: unknown): string => {
	if (typeof value !== 'string')
		throw new Error('Invalid community display name.');
	const normalized = value.trim();
	if (
		normalized.length < 1 ||
		normalized.length > CommunityInvitationLimits.displayName ||
		/[\u0000-\u001f\u007f]/.test(normalized)
	)
		throw new Error('Invalid community display name.');
	return normalized;
};

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

const isCalendarDate = (
	value: unknown,
): value is `${number}-${number}-${number}` => {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
		return false;
	const year = Number(value.slice(0, 4));
	const month = Number(value.slice(5, 7));
	const day = Number(value.slice(8, 10));
	const parsed = new Date(Date.UTC(year, month - 1, day));
	return (
		parsed.getUTCFullYear() === year &&
		parsed.getUTCMonth() === month - 1 &&
		parsed.getUTCDate() === day
	);
};

const isTimeZoneId = (value: unknown): value is string => {
	if (typeof value !== 'string' || value.length < 1 || value.length > 128)
		return false;
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
		return true;
	} catch {
		return false;
	}
};

const coordinatedJourney = (
	value: unknown,
): ICommunityInvitationJourneyPreview => {
	const journey = record(value);
	const course = record(journey['course']);
	if (
		!hasOnlyKeys(journey, [
			'course',
			'startDate',
			'timeZoneId',
			'status',
			'canEnroll',
		]) ||
		!hasOnlyKeys(course, ['courseId', 'courseVersionId']) ||
		!isIdentifier(course['courseId'], 128) ||
		!isIdentifier(course['courseVersionId'], 128) ||
		!isCalendarDate(journey['startDate']) ||
		!isTimeZoneId(journey['timeZoneId']) ||
		!['Scheduled', 'Active', 'Completed', 'Canceled'].includes(
			String(journey['status']),
		) ||
		typeof journey['canEnroll'] !== 'boolean'
	)
		throw new Error('Invalid coordinated journey preview.');
	return {
		course: {
			courseId: course['courseId'],
			courseVersionId: course['courseVersionId'],
		},
		startDate: journey['startDate'],
		timeZoneId: journey['timeZoneId'],
		status: journey[
			'status'
		] as ICommunityInvitationJourneyPreview['status'],
		canEnroll: journey['canEnroll'],
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

export const parsePreviewCommunityInvitationRequest = (
	value: unknown,
): IPreviewCommunityInvitationRequest => {
	const input = record(value);
	if (!hasOnlyKeys(input, ['invitationCode']) || !('invitationCode' in input))
		throw new Error('Invalid community invitation preview request.');
	return {
		invitationCode: normalizeCommunityInvitationCode(
			input['invitationCode'],
		),
	};
};

export const parseAcceptCommunityInvitationRequest = (
	value: unknown,
): IAcceptCommunityInvitationRequest => {
	const input = record(value);
	if (
		!hasOnlyKeys(input, ['invitationCode', 'displayName', 'operationId']) ||
		!('invitationCode' in input) ||
		!('displayName' in input) ||
		!('operationId' in input)
	)
		throw new Error('Invalid community invitation acceptance request.');
	return {
		invitationCode: normalizeCommunityInvitationCode(
			input['invitationCode'],
		),
		displayName: displayName(input['displayName']),
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

const parseInvitationPreview = (
	value: unknown,
): ICommunityInvitationPreview => {
	const preview = record(value);
	if (
		!hasOnlyKeys(preview, [
			'communityName',
			'communityPurpose',
			'organizerDisplayName',
			'participationExpectations',
			'expiresAt',
			'coordinatedJourney',
		]) ||
		typeof preview['communityName'] !== 'string' ||
		preview['communityName'].length < 1 ||
		preview['communityName'].length > 100 ||
		typeof preview['communityPurpose'] !== 'string' ||
		preview['communityPurpose'].length > 2000 ||
		typeof preview['organizerDisplayName'] !== 'string' ||
		preview['organizerDisplayName'].length > 80 ||
		(preview['participationExpectations'] !== undefined &&
			(typeof preview['participationExpectations'] !== 'string' ||
				preview['participationExpectations'].length > 2000))
	)
		throw new Error('Invalid community invitation preview response.');
	return {
		communityName: preview['communityName'],
		communityPurpose: preview['communityPurpose'],
		organizerDisplayName: preview['organizerDisplayName'].trim(),
		...(preview['participationExpectations'] === undefined
			? {}
			: {
					participationExpectations:
						preview['participationExpectations'],
				}),
		expiresAt: timestamp(preview['expiresAt']),
		...(preview['coordinatedJourney'] === undefined
			? {}
			: {
					coordinatedJourney: coordinatedJourney(
						preview['coordinatedJourney'],
					),
				}),
	};
};

export const parsePreviewCommunityInvitationResult = (
	value: unknown,
): IPreviewCommunityInvitationResult => {
	const result = record(value);
	if (!hasOnlyKeys(result, ['preview']))
		throw new Error('Invalid community invitation preview response.');
	return { preview: parseInvitationPreview(result['preview']) };
};

export const parseAcceptCommunityInvitationResult = (
	value: unknown,
): IAcceptCommunityInvitationResult => {
	const result = record(value);
	if (
		!hasOnlyKeys(result, ['outcome', 'community', 'membership']) ||
		!['Accepted', 'AlreadyMember', 'Rejoined'].includes(
			String(result['outcome']),
		)
	)
		throw new Error('Invalid community invitation acceptance response.');
	const parsedCommunity = parseCreateCommunityResult({
		community: result['community'],
	}).community;
	const member = record(result['membership']);
	if (
		!hasOnlyKeys(member, [
			'communityId',
			'userId',
			'displayName',
			'role',
		]) ||
		member['communityId'] !== parsedCommunity.communityId ||
		!isIdentifier(member['userId'], 128) ||
		typeof member['displayName'] !== 'string' ||
		member['displayName'].length > CommunityInvitationLimits.displayName ||
		(member['role'] !== 'Organizer' && member['role'] !== 'Member')
	)
		throw new Error('Invalid community invitation acceptance response.');
	return {
		outcome: result[
			'outcome'
		] as IAcceptCommunityInvitationResult['outcome'],
		community: parsedCommunity,
		membership: {
			communityId: parsedCommunity.communityId,
			userId: member['userId'],
			displayName: member['displayName'].trim(),
			role: member['role'] as ICommunityMemberSummary['role'],
		},
	};
};
