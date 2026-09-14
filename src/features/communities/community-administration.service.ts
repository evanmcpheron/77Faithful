import { app } from '@td/services/firebase/firebase.instance';
import type {
	ILeaveCommunityRequest,
	ILeaveCommunityResult,
	IRemoveCommunityMemberRequest,
	IRemoveCommunityMemberResult,
	ITransferCommunityOrganizerRequest,
	ITransferCommunityOrganizerResult,
	TCommunityAdministrationReasonCode,
} from '@td/types/community/community-function.types';
import { randomUUID } from 'expo-crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	parseLeaveCommunityRequest,
	parseLeaveCommunityResult,
	parseRemoveCommunityMemberRequest,
	parseRemoveCommunityMemberResult,
	parseTransferCommunityOrganizerRequest,
	parseTransferCommunityOrganizerResult,
} from './community-administration';

const administrationReasons: readonly TCommunityAdministrationReasonCode[] = [
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'InvalidInput',
	'AccountUnavailable',
	'CommunityUnavailable',
	'CommunityClosed',
	'OrganizerRequired',
	'MemberUnavailable',
	'OrganizerTransferRequired',
	'RevisionConflict',
	'OperationPayloadMismatch',
	'AdministrationDataUnavailable',
];

export const createCommunityAdministrationOperationId = (): string =>
	randomUUID();

export const getCommunityAdministrationReason = (
	error: unknown,
): TCommunityAdministrationReasonCode | null => {
	if (!error || typeof error !== 'object' || !('details' in error))
		return null;
	const details = error.details;
	if (!details || typeof details !== 'object' || !('reason' in details))
		return null;
	return (
		administrationReasons.find((reason) => reason === details.reason) ??
		null
	);
};

export const leaveCommunity = async (
	input: ILeaveCommunityRequest,
): Promise<ILeaveCommunityResult> => {
	const request = parseLeaveCommunityRequest(input);
	const callable = httpsCallable<ILeaveCommunityRequest, unknown>(
		getFunctions(app),
		'leaveCommunity',
	);
	return parseLeaveCommunityResult((await callable(request)).data);
};

export const removeCommunityMember = async (
	input: IRemoveCommunityMemberRequest,
): Promise<IRemoveCommunityMemberResult> => {
	const request = parseRemoveCommunityMemberRequest(input);
	const callable = httpsCallable<IRemoveCommunityMemberRequest, unknown>(
		getFunctions(app),
		'removeCommunityMember',
	);
	return parseRemoveCommunityMemberResult((await callable(request)).data);
};

export const transferCommunityOrganizer = async (
	input: ITransferCommunityOrganizerRequest,
): Promise<ITransferCommunityOrganizerResult> => {
	const request = parseTransferCommunityOrganizerRequest(input);
	const callable = httpsCallable<ITransferCommunityOrganizerRequest, unknown>(
		getFunctions(app),
		'transferCommunityOrganizer',
	);
	return parseTransferCommunityOrganizerResult(
		(await callable(request)).data,
	);
};
