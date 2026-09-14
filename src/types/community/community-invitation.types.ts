import type { IFormationCourseReference } from '../formation/formation-course.types';
import type {
	DomainSchemaVersion,
	IDocumentTimestamps,
	IPersistedTimestamp,
	TCalendarDate,
	TIanaTimeZoneId,
} from '../shared/persistence.types';
import type { TCommunityJourneyStatus } from './community-journey.types';

export const CommunityInvitationStatus = {
	Active: 'Active',
	Revoked: 'Revoked',
	Expired: 'Expired',
} as const;

export type TCommunityInvitationStatus =
	(typeof CommunityInvitationStatus)[keyof typeof CommunityInvitationStatus];

export type TCommunityInvitationLifecycle =
	| { status: typeof CommunityInvitationStatus.Active }
	| {
			status: typeof CommunityInvitationStatus.Revoked;
			revokedAt: IPersistedTimestamp;
	  }
	| { status: typeof CommunityInvitationStatus.Expired };

export const CommunityInvitationEncryptionAlgorithm = {
	Aes256Gcm: 'Aes256Gcm',
} as const;

export interface IEncryptedCommunityInvitationCode {
	algorithm: typeof CommunityInvitationEncryptionAlgorithm.Aes256Gcm;
	keyVersion: string;
	nonce: string;
	ciphertext: string;
	authenticationTag: string;
}

// Invitation administration is private; an active invitation grants no membership.
export interface ICommunityInvitationDocument extends IDocumentTimestamps {
	schemaVersion: typeof DomainSchemaVersion.Current;
	invitationModelVersion: 2;
	invitationId: string;
	communityId: string;
	createdByUserId: string;
	expiresAt: IPersistedTimestamp;
	lifecycle: TCommunityInvitationLifecycle;
	tokenDigest: string;
	encryptedCode: IEncryptedCommunityInvitationCode;
}

// Backend-only. Never return this lookup or store the plaintext code in Firestore.
export interface ICommunityInvitationDigestLookupDocument {
	invitationModelVersion: 2;
	communityId: string;
	invitationId: string;
	expiresAt: IPersistedTimestamp;
}

// Acceptance creates one private redemption per member; it never terminates the reusable invitation.
export interface ICommunityInvitationRedemptionDocument {
	schemaVersion: typeof DomainSchemaVersion.Current;
	communityId: string;
	invitationId: string;
	memberUserId: string;
	redeemedAt: IPersistedTimestamp;
}

export interface IOrganizerCommunityInvitation {
	communityId: string;
	invitationId: string;
	code: string;
	expiresAt: IPersistedTimestamp;
}

export interface ICommunityInvitationPreview {
	communityName: string;
	communityPurpose: string;
	organizerDisplayName: string;
	participationExpectations?: string;
	expiresAt: IPersistedTimestamp;
	coordinatedJourney?: ICommunityInvitationJourneyPreview;
}

export interface ICommunityInvitationJourneyPreview {
	course: IFormationCourseReference;
	startDate: TCalendarDate;
	timeZoneId: TIanaTimeZoneId;
	status: TCommunityJourneyStatus;
	canEnroll: boolean;
}
