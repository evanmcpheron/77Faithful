import type { TBibleVersionId } from '../formation/bible-version.types';
import type { IFormationCourseReference } from '../formation/formation-course.types';
import type { TOptionalPracticeSelection } from '../formation/practice.types';
import type { IWritingHead } from '../journey/journey-writing.types';
import type {
	DomainSchemaVersion,
	IDocumentTimestamps,
	IPersistedTimestamp,
	TCalendarDate,
	TIanaTimeZoneId,
} from '../shared/persistence.types';

export const CommunityJourneyStatus = {
	Scheduled: 'Scheduled',
	Active: 'Active',
	Completed: 'Completed',
	Canceled: 'Canceled',
} as const;

export type TCommunityJourneyStatus =
	(typeof CommunityJourneyStatus)[keyof typeof CommunityJourneyStatus];

export const CommunityJourneyEnrollmentWindow = {
	Open: 'Open',
	Closed: 'Closed',
} as const;

export type TCommunityJourneyEnrollmentWindow =
	(typeof CommunityJourneyEnrollmentWindow)[keyof typeof CommunityJourneyEnrollmentWindow];

export type TCommunityJourneyLifecycle =
	| {
			status: typeof CommunityJourneyStatus.Scheduled;
			enrollmentWindow: TCommunityJourneyEnrollmentWindow;
	  }
	| {
			status: typeof CommunityJourneyStatus.Active;
			startedAt: IPersistedTimestamp;
	  }
	| {
			status: typeof CommunityJourneyStatus.Completed;
			completedAt: IPersistedTimestamp;
	  }
	| {
			status: typeof CommunityJourneyStatus.Canceled;
			canceledAt: IPersistedTimestamp;
	  };

// The shared schedule never owns private days. Freeze it before accepting enrollments.
export interface ICommunityJourneyDocument extends IDocumentTimestamps {
	schemaVersion: typeof DomainSchemaVersion.Current;
	communityId: string;
	course: IFormationCourseReference;
	startDate: TCalendarDate;
	timeZoneId: TIanaTimeZoneId;
	lifecycle: TCommunityJourneyLifecycle;
	revision: number;
}

export interface ICommunityJourneyPreview {
	communityJourneyId: string;
	communityId: string;
	revision: number;
	course: IFormationCourseReference;
	startDate: TCalendarDate;
	timeZoneId: TIanaTimeZoneId;
	status: TCommunityJourneyStatus;
	canEnroll: boolean;
}

export const CommunityJourneyEnrollmentStatus = {
	Enrolled: 'Enrolled',
	Started: 'Started',
	Withdrawn: 'Withdrawn',
	StartBlocked: 'StartBlocked',
} as const;

export type TCommunityJourneyEnrollmentStatus =
	(typeof CommunityJourneyEnrollmentStatus)[keyof typeof CommunityJourneyEnrollmentStatus];

export const CommunityJourneyStartBlockReason = {
	ActivePersonalJourney: 'ActivePersonalJourney',
	MembershipEnded: 'MembershipEnded',
	CommunityJourneyCanceled: 'CommunityJourneyCanceled',
} as const;

export type TCommunityJourneyStartBlockReason =
	(typeof CommunityJourneyStartBlockReason)[keyof typeof CommunityJourneyStartBlockReason];

export type TCommunityJourneyEnrollmentLifecycle =
	| { status: typeof CommunityJourneyEnrollmentStatus.Enrolled }
	| {
			status: typeof CommunityJourneyEnrollmentStatus.Started;
			journeyId: string;
			startedAt: IPersistedTimestamp;
	  }
	| {
			status: typeof CommunityJourneyEnrollmentStatus.Withdrawn;
			withdrawnAt: IPersistedTimestamp;
	  }
	| {
			status: typeof CommunityJourneyEnrollmentStatus.StartBlocked;
			reason: TCommunityJourneyStartBlockReason;
			blockedAt: IPersistedTimestamp;
	  };

// Participant/server-private. Organizers cannot read practice choices or the personal journey link.
export interface ICommunityJourneyEnrollmentDocument extends IDocumentTimestamps {
	schemaVersion: typeof DomainSchemaVersion.Current;
	communityId: string;
	communityJourneyId: string;
	userId: string;
	optionalPracticeIds: TOptionalPracticeSelection;
	bibleVersionId: TBibleVersionId;
	setupDraftId: string;
	setupRevision: number;
	// Preserve source revisions/conflicts through setup removal and transfer them at actual start.
	startingMotivation: IWritingHead | null;
	lifecycle: TCommunityJourneyEnrollmentLifecycle;
}
