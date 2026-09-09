import type {
  DomainSchemaVersion,
  IDocumentTimestamps,
  IPersistedTimestamp,
} from '../shared/persistence.types';
import type { ICommunityAuthorSummary } from './community-membership.types';

export const CommunityPostType = {
  PrayerRequest: 'PrayerRequest',
  Discussion: 'Discussion',
  OrganizerAnnouncement: 'OrganizerAnnouncement',
  SharedReflectionCopy: 'SharedReflectionCopy',
} as const;

export type TCommunityPostType = (typeof CommunityPostType)[keyof typeof CommunityPostType];

export const PrayerRequestStatus = {
  Current: 'Current',
  NoLongerCurrent: 'NoLongerCurrent',
  Answered: 'Answered',
} as const;

export type TPrayerRequestStatus = (typeof PrayerRequestStatus)[keyof typeof PrayerRequestStatus];

export interface ICommunityPrayerRequestContent {
  postType: typeof CommunityPostType.PrayerRequest;
  text: string;
  prayerRequestStatus: TPrayerRequestStatus;
}

export interface ICommunityDiscussionContent {
  postType: typeof CommunityPostType.Discussion;
  text: string;
}

export interface ICommunityAnnouncementContent {
  postType: typeof CommunityPostType.OrganizerAnnouncement;
  text: string;
}

// Deliberately copied text, with no original journey, day, writing, or revision reference.
export interface ICommunitySharedReflectionContent {
  postType: typeof CommunityPostType.SharedReflectionCopy;
  text: string;
}

export type TCommunityPostContent =
  | ICommunityPrayerRequestContent
  | ICommunityDiscussionContent
  | ICommunityAnnouncementContent
  | ICommunitySharedReflectionContent;

export const CommunityContentStatus = {
  Published: 'Published',
  AuthorDeleted: 'AuthorDeleted',
  ModeratorRemoved: 'ModeratorRemoved',
} as const;

export type TCommunityContentStatus =
  (typeof CommunityContentStatus)[keyof typeof CommunityContentStatus];

export interface IPublishedCommunityPost {
  status: typeof CommunityContentStatus.Published;
  content: TCommunityPostContent;
}

export interface IAuthorDeletedCommunityPost {
  status: typeof CommunityContentStatus.AuthorDeleted;
  postType: TCommunityPostType;
  deletedAt: IPersistedTimestamp;
}

export interface IModeratorRemovedCommunityPost {
  status: typeof CommunityContentStatus.ModeratorRemoved;
  postType: TCommunityPostType;
  removedAt: IPersistedTimestamp;
}

// Tombstones keep thread identity but omit text. Private report reasons never appear here.
export interface ICommunityPostDocument extends IDocumentTimestamps {
  schemaVersion: typeof DomainSchemaVersion.Current;
  communityId: string;
  author: ICommunityAuthorSummary;
  revision: number;
  editedAt: IPersistedTimestamp | null;
  publication:
    IPublishedCommunityPost | IAuthorDeletedCommunityPost | IModeratorRemovedCommunityPost;
}

export interface IPublishedCommunityReply {
  status: typeof CommunityContentStatus.Published;
  text: string;
}

export interface IAuthorDeletedCommunityReply {
  status: typeof CommunityContentStatus.AuthorDeleted;
  deletedAt: IPersistedTimestamp;
}

export interface IModeratorRemovedCommunityReply {
  status: typeof CommunityContentStatus.ModeratorRemoved;
  removedAt: IPersistedTimestamp;
}

// Replies are individual records; there is no growing replies array or arbitrary nesting.
export interface ICommunityReplyDocument extends IDocumentTimestamps {
  schemaVersion: typeof DomainSchemaVersion.Current;
  communityId: string;
  postId: string;
  author: ICommunityAuthorSummary;
  revision: number;
  editedAt: IPersistedTimestamp | null;
  publication:
    IPublishedCommunityReply | IAuthorDeletedCommunityReply | IModeratorRemovedCommunityReply;
}
