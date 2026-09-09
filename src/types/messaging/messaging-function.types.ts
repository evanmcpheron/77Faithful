import type { IPersistedTimestamp } from '../shared/persistence.types';
import type { IConversationReadPosition, IConversationSummary } from './conversation.types';

export interface ICreateCommunityConversationRequest {
  communityId: string;
  title: string;
  operationId: string;
}

export interface ICreateCommunityConversationResult {
  conversation: IConversationSummary;
}

export interface IJoinCommunityConversationRequest {
  communityId: string;
  conversationId: string;
  operationId: string;
}

export interface IJoinCommunityConversationResult {
  conversationId: string;
  joinedAt: IPersistedTimestamp;
}

export interface ILeaveCommunityConversationRequest {
  communityId: string;
  conversationId: string;
  operationId: string;
}

export interface ILeaveCommunityConversationResult {
  conversationId: string;
  leftAt: IPersistedTimestamp;
}

// Membership, sender identity, message ID, audit time, and current availability are server-validated.
export interface ISendMessageRequest {
  communityId: string;
  conversationId: string;
  text: string;
  operationId: string;
}

export interface ISendMessageResult {
  conversationId: string;
  messageId: string;
  revision: number;
  createdAt: IPersistedTimestamp;
}

export interface IEditMessageRequest {
  communityId: string;
  conversationId: string;
  messageId: string;
  text: string;
  expectedRevision: number;
  operationId: string;
}

export interface IEditMessageResult {
  messageId: string;
  revision: number;
  editedAt: IPersistedTimestamp;
}

export interface IDeleteMessageRequest {
  communityId: string;
  conversationId: string;
  messageId: string;
  expectedRevision: number;
  operationId: string;
}

export interface IDeleteMessageResult {
  messageId: string;
  deletedAt: IPersistedTimestamp;
}

export interface IMarkConversationReadRequest {
  communityId: string;
  conversationId: string;
  messageId: string;
}

export interface IMarkConversationReadResult {
  conversationId: string;
  lastRead: IConversationReadPosition;
}
