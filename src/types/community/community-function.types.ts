import type { IFormationCourseReference } from '../formation/formation-course.types';
import type {
	IPersistedTimestamp,
	TCalendarDate,
	TIanaTimeZoneId,
} from '../shared/persistence.types';
import type {
	ICommunityInvitationPreview,
	IOrganizerCommunityInvitation,
} from './community-invitation.types';
import type { ICommunityJourneyPreview } from './community-journey.types';
import type { ICommunityMemberSummary } from './community-membership.types';
import type {
	ICommunityContext,
	ICommunitySettings,
	ICommunitySummary,
} from './community.types';

export type TCommunityReaderReasonCode =
	| 'AuthenticationRequired'
	| 'EmailVerificationRequired'
	| 'InvalidInput'
	| 'InvalidCursor'
	| 'AccountUnavailable'
	| 'CommunityUnavailable';

export type TCommunityInvitationReasonCode =
	| 'AuthenticationRequired'
	| 'EmailVerificationRequired'
	| 'InvalidInput'
	| 'AccountUnavailable'
	| 'CommunityUnavailable'
	| 'OrganizerRequired'
	| 'CommunityClosed'
	| 'InvitationUnavailable'
	| 'InvitationMigrationRequired'
	| 'InvitationConfigurationUnavailable'
	| 'InvitationDataUnavailable'
	| 'OperationPayloadMismatch'
	| 'MembershipRemoved'
	| 'MembershipUnavailable'
	| 'RateLimited';

export type TCommunityInvitationAcceptanceOutcome =
	'Accepted' | 'AlreadyMember' | 'Rejoined';

// All caller identity, roles, generated IDs, lifecycle transitions, and audit times are server-owned.
export interface ICreateCommunityRequest {
	name: string;
	purpose: string;
	settings: ICommunitySettings;
	operationId: string;
}

export interface ICreateCommunityResult {
	community: ICommunitySummary;
}

export interface IGetCommunityContextRequest {
	communityId: string;
}

export interface IGetCommunityContextResult {
	context: ICommunityContext;
}

export interface IListCommunitiesPageRequest {
	pageSize?: number;
	cursor?: string;
}

export interface IListCommunitiesPageResult {
	communities: ICommunitySummary[];
	nextCursor: string | null;
}

export interface IListCommunityMembersRequest {
	communityId: string;
	pageSize?: number;
	cursor?: string;
}

export interface IListCommunityMembersResult {
	members: ICommunityMemberSummary[];
	nextCursor: string | null;
}

export interface IIssueCommunityInvitationRequest {
	communityId: string;
	operationId: string;
}

export interface IIssueCommunityInvitationResult {
	invitation: IOrganizerCommunityInvitation;
}

export interface IGetCurrentCommunityInvitationRequest {
	communityId: string;
}

export interface IGetCurrentCommunityInvitationResult {
	invitation: IOrganizerCommunityInvitation | null;
}

export interface IRotateCommunityInvitationRequest {
	communityId: string;
	operationId: string;
}

export interface IRotateCommunityInvitationResult {
	invitation: IOrganizerCommunityInvitation;
}

export interface IRevokeCommunityInvitationRequest {
	communityId: string;
	invitationId: string;
	operationId: string;
}

export interface IRevokeCommunityInvitationResult {
	communityId: string;
	invitationId: string;
	revokedAt: IPersistedTimestamp;
}

// Legacy, unregistered compatibility shape. The implemented organizer operation is Issue.
export type ICreateCommunityInvitationRequest =
	IIssueCommunityInvitationRequest;
export interface ICreateCommunityInvitationResult {
	invitation: ICommunityInvitationPreview;
	// This would be the reusable code, not a return-once or single-use secret.
	invitationToken: string;
}

export interface IPreviewCommunityInvitationRequest {
	invitationCode: string;
}

export interface IPreviewCommunityInvitationResult {
	preview: ICommunityInvitationPreview;
}

export interface IAcceptCommunityInvitationRequest {
	invitationCode: string;
	displayName: string;
	operationId: string;
}

export interface IAcceptCommunityInvitationResult {
	outcome: TCommunityInvitationAcceptanceOutcome;
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
