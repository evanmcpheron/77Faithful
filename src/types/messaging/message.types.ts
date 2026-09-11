import type {
	DomainSchemaVersion,
	IDocumentTimestamps,
	IPersistedTimestamp,
} from '../shared/persistence.types';

export const MessageType = {
	Text: 'Text',
} as const;

export type TMessageType = (typeof MessageType)[keyof typeof MessageType];

export const MessageStatus = {
	Sent: 'Sent',
	AuthorDeleted: 'AuthorDeleted',
	ModeratorRemoved: 'ModeratorRemoved',
} as const;

export type TMessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export interface IMessageSenderSummary {
	userId: string;
	displayName: string;
}

export interface ISentTextMessage {
	status: typeof MessageStatus.Sent;
	text: string;
}

export interface IAuthorDeletedMessage {
	status: typeof MessageStatus.AuthorDeleted;
	deletedAt: IPersistedTimestamp;
}

export interface IModeratorRemovedMessage {
	status: typeof MessageStatus.ModeratorRemoved;
	removedAt: IPersistedTimestamp;
}

// Each message has its own document. Removal preserves identity without retained readable text.
export interface IMessageDocument extends IDocumentTimestamps {
	schemaVersion: typeof DomainSchemaVersion.Current;
	communityId: string;
	conversationId: string;
	messageType: typeof MessageType.Text;
	sender: IMessageSenderSummary;
	revision: number;
	editedAt: IPersistedTimestamp | null;
	publication:
		ISentTextMessage | IAuthorDeletedMessage | IModeratorRemovedMessage;
}
