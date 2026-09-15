import type { IPersistedTimestamp } from '../shared/persistence.types';

export type TCommunitySafetyReasonCode =
	| 'InvalidInput'
	| 'InvalidCursor'
	| 'AccountUnavailable'
	| 'CommunityUnavailable'
	| 'TargetUnavailable'
	| 'SelfTarget'
	| 'BlockedInteraction'
	| 'RateLimited'
	| 'SubmissionRejected'
	| 'SafetyConfigurationUnavailable'
	| 'OperationPayloadMismatch';

export interface ICommunityBlockDocument {
	schemaVersion: 1;
	ownerUserId: string;
	blockedUserId: string;
	displayName: string;
	createdAt: IPersistedTimestamp;
}

export interface IBlockCommunityMemberRequest {
	communityId: string;
	memberUserId: string;
	operationId: string;
}

export interface IUnblockCommunityMemberRequest {
	memberUserId: string;
	operationId: string;
}

export interface ICommunityBlockResult {
	memberUserId: string;
	isBlocked: boolean;
}

export interface IListBlockedCommunityMembersRequest {
	pageSize?: number;
	cursor?: string;
}

export interface IListBlockedCommunityMembersResult {
	members: Pick<ICommunityBlockDocument, 'blockedUserId' | 'displayName'>[];
	nextCursor: string | null;
}
