import { app } from '@td/services/firebase/firebase.instance';
import type {
	IGetCurrentCommunityInvitationRequest,
	IGetCurrentCommunityInvitationResult,
	IIssueCommunityInvitationRequest,
	IRevokeCommunityInvitationRequest,
	IRotateCommunityInvitationRequest,
	TCommunityInvitationReasonCode,
} from '@td/types/community/community-function.types';
import { randomUUID } from 'expo-crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	parseGetCurrentCommunityInvitationRequest,
	parseGetCurrentCommunityInvitationResult,
	parseIssueCommunityInvitationRequest,
	parseIssueCommunityInvitationResult,
	parseRevokeCommunityInvitationRequest,
	parseRevokeCommunityInvitationResult,
	parseRotateCommunityInvitationRequest,
	parseRotateCommunityInvitationResult,
} from './community-invitation';

const invitationReasons: readonly TCommunityInvitationReasonCode[] = [
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'InvalidInput',
	'AccountUnavailable',
	'CommunityUnavailable',
	'OrganizerRequired',
	'CommunityClosed',
	'InvitationUnavailable',
	'InvitationMigrationRequired',
	'InvitationConfigurationUnavailable',
	'InvitationDataUnavailable',
	'OperationPayloadMismatch',
	'MembershipRemoved',
	'MembershipUnavailable',
	'RateLimited',
];

export const createCommunityInvitationOperationId = (): string => randomUUID();

export const getCommunityInvitationReason = (
	error: unknown,
): TCommunityInvitationReasonCode | null => {
	if (!error || typeof error !== 'object' || !('details' in error))
		return null;
	const details = error.details;
	if (!details || typeof details !== 'object' || !('reason' in details))
		return null;
	return (
		invitationReasons.find((reason) => reason === details.reason) ?? null
	);
};

export const getCurrentCommunityInvitation = async (communityId: string) => {
	const request = parseGetCurrentCommunityInvitationRequest({ communityId });
	const callable = httpsCallable<
		IGetCurrentCommunityInvitationRequest,
		IGetCurrentCommunityInvitationResult
	>(getFunctions(app), 'getCurrentCommunityInvitation');
	return parseGetCurrentCommunityInvitationResult(
		(await callable(request)).data,
	).invitation;
};

export const issueCommunityInvitation = async (
	input: IIssueCommunityInvitationRequest,
) => {
	const request = parseIssueCommunityInvitationRequest(input);
	const callable = httpsCallable<IIssueCommunityInvitationRequest, unknown>(
		getFunctions(app),
		'issueCommunityInvitation',
	);
	return parseIssueCommunityInvitationResult((await callable(request)).data)
		.invitation;
};

export const rotateCommunityInvitation = async (
	input: IRotateCommunityInvitationRequest,
) => {
	const request = parseRotateCommunityInvitationRequest(input);
	const callable = httpsCallable<IRotateCommunityInvitationRequest, unknown>(
		getFunctions(app),
		'rotateCommunityInvitation',
	);
	return parseRotateCommunityInvitationResult((await callable(request)).data)
		.invitation;
};

export const revokeCommunityInvitation = async (
	input: IRevokeCommunityInvitationRequest,
) => {
	const request = parseRevokeCommunityInvitationRequest(input);
	const callable = httpsCallable<IRevokeCommunityInvitationRequest, unknown>(
		getFunctions(app),
		'revokeCommunityInvitation',
	);
	return parseRevokeCommunityInvitationResult((await callable(request)).data);
};
