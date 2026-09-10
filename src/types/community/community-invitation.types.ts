import type {
	DomainSchemaVersion,
	IDocumentTimestamps,
	IPersistedTimestamp,
} from '../shared/persistence.types';
import type { ICommunityJourneyPreview } from './community-journey.types';
import type { ICommunitySummary } from './community.types';

export const CommunityInvitationStatus = {
	Pending: 'Pending',
	Accepted: 'Accepted',
	Revoked: 'Revoked',
	Expired: 'Expired',
} as const;

export type TCommunityInvitationStatus =
	(typeof CommunityInvitationStatus)[keyof typeof CommunityInvitationStatus];

export type TCommunityInvitationLifecycle =
	| { status: typeof CommunityInvitationStatus.Pending }
	| {
			status: typeof CommunityInvitationStatus.Accepted;
			acceptedByUserId: string;
			acceptedAt: IPersistedTimestamp;
	  }
	| {
			status: typeof CommunityInvitationStatus.Revoked;
			revokedAt: IPersistedTimestamp;
	  }
	| { status: typeof CommunityInvitationStatus.Expired };

// Invitation administration is private; a pending invitation grants no membership.
export interface ICommunityInvitationDocument extends IDocumentTimestamps {
	schemaVersion: typeof DomainSchemaVersion.Current;
	communityId: string;
	createdByUserId: string;
	expiresAt: IPersistedTimestamp;
	lifecycle: TCommunityInvitationLifecycle;
}

// Backend-only. Never return the digest or store the bearer token in member-readable data.
export interface ICommunityInvitationSecretDocument {
	communityId: string;
	invitationId: string;
	tokenDigest: string;
}

export interface ICommunityInvitationPreview {
	invitationId: string;
	community: ICommunitySummary;
	expiresAt: IPersistedTimestamp;
	coordinatedJourney?: ICommunityJourneyPreview;
}
