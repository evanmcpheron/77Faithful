import type {
	DomainSchemaVersion,
	IDocumentTimestamps,
	IPersistedTimestamp,
} from '../shared/persistence.types';
import type { ICommunityAuthorSummary } from './community-membership.types';

export const CommunityProgressConsentStatus = {
	Private: 'Private',
	Shared: 'Shared',
} as const;

export type TCommunityProgressConsentStatus =
	(typeof CommunityProgressConsentStatus)[keyof typeof CommunityProgressConsentStatus];

export type TCommunityProgressConsent =
	| { status: typeof CommunityProgressConsentStatus.Private }
	| {
			status: typeof CommunityProgressConsentStatus.Shared;
			consentedAt: IPersistedTimestamp;
	  };

// Private by default; individual and aggregate consent are independently revocable.
export interface ICommunityProgressSharingPreferenceDocument extends IDocumentTimestamps {
	schemaVersion: typeof DomainSchemaVersion.Current;
	communityId: string;
	communityJourneyId: string;
	userId: string;
	individualProgress: TCommunityProgressConsent;
	aggregateProgress: TCommunityProgressConsent;
}

export const SharedCommunityJourneyStage = {
	Active: 'Active',
	Completed: 'Completed',
	EndedEarly: 'EndedEarly',
} as const;

export type TSharedCommunityJourneyStage =
	(typeof SharedCommunityJourneyStage)[keyof typeof SharedCommunityJourneyStage];

// Derived only for consenting participants; no practice markers, private dates, or streaks.
export interface ISharedCommunityProgress {
	communityId: string;
	communityJourneyId: string;
	participant: ICommunityAuthorSummary;
	journeyStage: TSharedCommunityJourneyStage;
	calculatedAt: IPersistedTimestamp;
}

// Counts include only aggregate-consenting members. Suppress results that reveal opted-out members.
export interface ICommunityAggregateProgress {
	communityId: string;
	communityJourneyId: string;
	contributingMemberCount: number;
	activeJourneyCount: number;
	completedJourneyCount: number;
	endedEarlyJourneyCount: number;
	calculatedAt: IPersistedTimestamp;
}

export interface ISetCommunityProgressSharingRequest {
	communityId: string;
	communityJourneyId: string;
	shouldShareIndividualProgress: boolean;
	shouldContributeToAggregateProgress: boolean;
}

export interface ISetCommunityProgressSharingResult {
	communityId: string;
	communityJourneyId: string;
	individualProgress: TCommunityProgressConsent;
	aggregateProgress: TCommunityProgressConsent;
}
