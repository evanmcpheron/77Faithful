import type {
  DomainSchemaVersion,
  IDocumentTimestamps,
  IPersistedTimestamp,
} from '../shared/persistence.types';

export const ConversationKind = {
  Community: 'Community',
} as const;

export type TConversationKind = (typeof ConversationKind)[keyof typeof ConversationKind];

export const ConversationStatus = {
  Active: 'Active',
  Closed: 'Closed',
} as const;

export type TConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus];

export type TConversationLifecycle =
  | { status: typeof ConversationStatus.Active }
  | { status: typeof ConversationStatus.Closed; closedAt: IPersistedTimestamp };

// A future community text conversation. No public access or arbitrary direct recipients.
export interface IConversationDocument extends IDocumentTimestamps {
  schemaVersion: typeof DomainSchemaVersion.Current;
  kind: typeof ConversationKind.Community;
  communityId: string;
  title: string;
  createdByUserId: string;
  lifecycle: TConversationLifecycle;
}

export interface IConversationSummary {
  conversationId: string;
  communityId: string;
  kind: typeof ConversationKind.Community;
  title: string;
  status: TConversationStatus;
}

export const ConversationParticipationStatus = {
  Active: 'Active',
  Left: 'Left',
} as const;

export type TConversationParticipationStatus =
  (typeof ConversationParticipationStatus)[keyof typeof ConversationParticipationStatus];

export interface IConversationReadPosition {
  messageId: string;
  messageCreatedAt: IPersistedTimestamp;
}

// Read positions are private per participant, monotonic in (createdAt, messageId) order.
// Re-check active community membership on every access; participation is not authorization.
export interface IConversationParticipantDocument extends IDocumentTimestamps {
  schemaVersion: typeof DomainSchemaVersion.Current;
  communityId: string;
  conversationId: string;
  userId: string;
  status: TConversationParticipationStatus;
  lastRead: IConversationReadPosition | null;
}
