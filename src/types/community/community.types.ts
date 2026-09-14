import type {
	DomainSchemaVersion,
	IDocumentTimestamps,
	IPersistedTimestamp,
} from '../shared/persistence.types';
import type {
	ICommunityAuthorSummary,
	ICurrentCommunityMembershipSummary,
} from './community-membership.types';

export const CommunityStatus = {
	Active: 'Active',
	Closed: 'Closed',
} as const;

export type TCommunityStatus =
	(typeof CommunityStatus)[keyof typeof CommunityStatus];

export type TCommunityLifecycle =
	| { status: typeof CommunityStatus.Active }
	| { status: typeof CommunityStatus.Closed; closedAt: IPersistedTimestamp };

export interface ICommunitySettings {
	participationExpectations?: string;
}

// All communities are private and invitation-based. There is no public-access setting.
export interface ICommunityDocument extends IDocumentTimestamps {
	schemaVersion: typeof DomainSchemaVersion.Current;
	name: string;
	purpose: string;
	organizerUserId: string;
	settings: ICommunitySettings;
	lifecycle: TCommunityLifecycle;
	activeInvitationId: string | null;
	revision: number;
}

export interface ICommunitySummary {
	communityId: string;
	name: string;
	purpose: string;
	organizer: ICommunityAuthorSummary;
	participationExpectations?: string;
	status: TCommunityStatus;
}

export interface ICommunityCapabilities {
	canReadMembers: boolean;
	canCreatePost: boolean;
	canInviteMembers: boolean;
	canManageMembers: boolean;
	canEditCommunity: boolean;
	canCloseCommunity: boolean;
	canLeaveCommunity: boolean;
}

export interface IBoundedCommunityMemberCount {
	value: number;
	isExact: boolean;
}

export interface ICommunityContext {
	community: ICommunitySummary;
	membership: ICurrentCommunityMembershipSummary;
	capabilities: ICommunityCapabilities;
	activeMemberCount: IBoundedCommunityMemberCount;
}
