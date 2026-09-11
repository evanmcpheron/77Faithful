import type { IFormationCourseReference } from '../formation/formation-course.types';
import type {
	IPersistedTimestamp,
	TCalendarDate,
	TIanaTimeZoneId,
} from '../shared/persistence.types';
import type { ICommunityInvitationPreview } from './community-invitation.types';
import type { ICommunityJourneyPreview } from './community-journey.types';
import type { ICommunityMemberSummary } from './community-membership.types';
import type { ICommunitySettings, ICommunitySummary } from './community.types';

// All caller identity, roles, generated IDs, lifecycle transitions, and audit times are server-owned.
export interface ICreateCommunityRequest {
	name: string;
	purpose: string;
	organizerDisplayName: string;
	settings: ICommunitySettings;
	operationId: string;
}

export interface ICreateCommunityResult {
	community: ICommunitySummary;
}

export interface ICreateCommunityInvitationRequest {
	communityId: string;
	operationId: string;
}

export interface ICreateCommunityInvitationResult {
	invitation: ICommunityInvitationPreview;
	// Return once to the authorized inviter; never include it in a general community projection.
	invitationToken: string;
}

export interface IRevokeCommunityInvitationRequest {
	communityId: string;
	invitationId: string;
	operationId: string;
}

export interface IRevokeCommunityInvitationResult {
	invitationId: string;
	revokedAt: IPersistedTimestamp;
}

export interface IAcceptCommunityInvitationRequest {
	invitationToken: string;
	displayName: string;
	operationId: string;
}

export interface IAcceptCommunityInvitationResult {
	community: ICommunitySummary;
	membership: ICommunityMemberSummary;
}

export interface ILeaveCommunityRequest {
	communityId: string;
	operationId: string;
}

export interface ILeaveCommunityResult {
	communityId: string;
	leftAt: IPersistedTimestamp;
}

export interface IRemoveCommunityMemberRequest {
	communityId: string;
	memberUserId: string;
	privateReason: string;
	operationId: string;
}

export interface IRemoveCommunityMemberResult {
	communityId: string;
	memberUserId: string;
	removedAt: IPersistedTimestamp;
}

export interface ITransferCommunityOrganizerRequest {
	communityId: string;
	nextOrganizerUserId: string;
	expectedRevision: number;
	operationId: string;
}

export interface ITransferCommunityOrganizerResult {
	community: ICommunitySummary;
}

export interface ICloseCommunityRequest {
	communityId: string;
	expectedRevision: number;
	operationId: string;
}

export interface ICloseCommunityResult {
	communityId: string;
	closedAt: IPersistedTimestamp;
}

// Creates a coordinated schedule, never a future-start personal journey.
export interface IConfigureCommunityJourneyRequest {
	communityId: string;
	course: IFormationCourseReference;
	startDate: TCalendarDate;
	timeZoneId: TIanaTimeZoneId;
	operationId: string;
}

export interface IConfigureCommunityJourneyResult {
	communityJourney: ICommunityJourneyPreview;
}

export interface IEnrollCommunityJourneyRequest {
	communityId: string;
	communityJourneyId: string;
	expectedCommunityJourneyRevision: number;
	setupDraftId: string;
	expectedSetupRevision: number;
	operationId: string;
}

export interface IEnrollCommunityJourneyResult {
	communityJourneyEnrollmentId: string;
	communityJourney: ICommunityJourneyPreview;
	enrolledAt: IPersistedTimestamp;
}

export interface IWithdrawCommunityJourneyEnrollmentRequest {
	communityId: string;
	communityJourneyId: string;
	operationId: string;
}

export interface IWithdrawCommunityJourneyEnrollmentResult {
	communityJourneyEnrollmentId: string;
	withdrawnAt: IPersistedTimestamp;
}
