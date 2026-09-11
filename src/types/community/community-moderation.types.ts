import type {
	DomainSchemaVersion,
	IDocumentTimestamps,
	IPersistedTimestamp,
} from '../shared/persistence.types';

export const CommunityReportTargetType = {
	Post: 'Post',
	Reply: 'Reply',
	Message: 'Message',
	Member: 'Member',
	Community: 'Community',
} as const;

export type TCommunityReportTargetType =
	(typeof CommunityReportTargetType)[keyof typeof CommunityReportTargetType];

export interface ICommunityPostReportTarget {
	targetType: typeof CommunityReportTargetType.Post;
	postId: string;
}

export interface ICommunityReplyReportTarget {
	targetType: typeof CommunityReportTargetType.Reply;
	postId: string;
	replyId: string;
}

export interface ICommunityMessageReportTarget {
	targetType: typeof CommunityReportTargetType.Message;
	conversationId: string;
	messageId: string;
}

export interface ICommunityMemberReportTarget {
	targetType: typeof CommunityReportTargetType.Member;
	userId: string;
}

export interface IWholeCommunityReportTarget {
	targetType: typeof CommunityReportTargetType.Community;
}

export type TCommunityContentReportTarget =
	| ICommunityPostReportTarget
	| ICommunityReplyReportTarget
	| ICommunityMessageReportTarget;

export type TCommunityReportTarget =
	| TCommunityContentReportTarget
	| ICommunityMemberReportTarget
	| IWholeCommunityReportTarget;

export const CommunityReportReason = {
	Harassment: 'Harassment',
	CoerciveReligiousPressure: 'CoerciveReligiousPressure',
	FinancialSolicitation: 'FinancialSolicitation',
	PrivacyViolation: 'PrivacyViolation',
	UnsafeMedicalClaims: 'UnsafeMedicalClaims',
	AbuseOfSpiritualAuthority: 'AbuseOfSpiritualAuthority',
	Other: 'Other',
} as const;

export type TCommunityReportReason =
	(typeof CommunityReportReason)[keyof typeof CommunityReportReason];

export const CommunityReportStatus = {
	Submitted: 'Submitted',
	UnderReview: 'UnderReview',
	Resolved: 'Resolved',
} as const;

export type TCommunityReportStatus =
	(typeof CommunityReportStatus)[keyof typeof CommunityReportStatus];

export type TCommunityReportReview =
	| { status: typeof CommunityReportStatus.Submitted }
	| {
			status: typeof CommunityReportStatus.UnderReview;
			reviewerUserId: string;
			reviewStartedAt: IPersistedTimestamp;
	  }
	| {
			status: typeof CommunityReportStatus.Resolved;
			moderationActionId: string;
			resolvedAt: IPersistedTimestamp;
	  };

// Restricted safety records. Membership and organizer role alone do not grant report access.
export interface ICommunityReportDocument extends IDocumentTimestamps {
	schemaVersion: typeof DomainSchemaVersion.Current;
	communityId: string;
	reporterUserId: string;
	target: TCommunityReportTarget;
	reason: TCommunityReportReason;
	explanation?: string;
	review: TCommunityReportReview;
	revision: number;
}

export const CommunityModerationAction = {
	RemoveContent: 'RemoveContent',
	RemoveMember: 'RemoveMember',
	CloseCommunity: 'CloseCommunity',
	NoAction: 'NoAction',
} as const;

export type TCommunityModerationAction =
	(typeof CommunityModerationAction)[keyof typeof CommunityModerationAction];

export type TCommunityModerationDecision =
	| {
			action: typeof CommunityModerationAction.RemoveContent;
			target: TCommunityContentReportTarget;
	  }
	| {
			action: typeof CommunityModerationAction.RemoveMember;
			target: ICommunityMemberReportTarget;
	  }
	| {
			action: typeof CommunityModerationAction.CloseCommunity;
			target: IWholeCommunityReportTarget;
	  }
	| {
			action: typeof CommunityModerationAction.NoAction;
			target: TCommunityReportTarget;
	  };

export interface ICommunityModerationActionDocument {
	schemaVersion: typeof DomainSchemaVersion.Current;
	communityId: string;
	reportId?: string;
	decidedByUserId: string;
	decision: TCommunityModerationDecision;
	explanation: string;
	createdAt: IPersistedTimestamp;
}

export interface IReportCommunityContentRequest {
	communityId: string;
	target: TCommunityReportTarget;
	reason: TCommunityReportReason;
	explanation?: string;
	operationId: string;
}

export interface IReportCommunityContentResult {
	reportId: string;
	status: typeof CommunityReportStatus.Submitted;
}

// Authorized reviewers request a decision; the server determines authority, actor, and timestamps.
export interface IReviewCommunityReportRequest {
	communityId: string;
	reportId: string;
	expectedRevision: number;
	requestedAction: TCommunityModerationAction;
	explanation: string;
	operationId: string;
}

export interface IReviewCommunityReportResult {
	reportId: string;
	moderationActionId: string;
	status: typeof CommunityReportStatus.Resolved;
}
