import type {
  DomainSchemaVersion,
  IDocumentTimestamps,
  IPersistedTimestamp,
} from '../shared/persistence.types';

export const CommunityRole = {
  Organizer: 'Organizer',
  Member: 'Member',
} as const;

export type TCommunityRole = (typeof CommunityRole)[keyof typeof CommunityRole];

export const CommunityMembershipStatus = {
  Active: 'Active',
  Leaving: 'Leaving',
  Left: 'Left',
  Removed: 'Removed',
} as const;

export type TCommunityMembershipStatus =
  (typeof CommunityMembershipStatus)[keyof typeof CommunityMembershipStatus];

export type TCommunityMembershipLifecycle =
  | { status: typeof CommunityMembershipStatus.Active }
  | {
      status: typeof CommunityMembershipStatus.Leaving;
      leaveRequestedAt: IPersistedTimestamp;
    }
  | { status: typeof CommunityMembershipStatus.Left; leftAt: IPersistedTimestamp }
  | {
      status: typeof CommunityMembershipStatus.Removed;
      removedAt: IPersistedTimestamp;
    };

export interface ICommunityMembershipDocument extends IDocumentTimestamps {
  schemaVersion: typeof DomainSchemaVersion.Current;
  communityId: string;
  userId: string;
  displayName: string;
  role: TCommunityRole;
  joinedAt: IPersistedTimestamp;
  lifecycle: TCommunityMembershipLifecycle;
}

// Construct these projections explicitly; private profiles are never community documents.
export interface ICommunityMemberSummary {
  communityId: string;
  userId: string;
  displayName: string;
  role: TCommunityRole;
}

export interface ICommunityAuthorSummary {
  userId: string;
  displayName: string;
}
