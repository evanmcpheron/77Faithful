import type { IPersistedTimestamp } from '../shared/persistence.types';
import type {
	ICommunityPost,
	ICommunityPrayerSupporter,
	ICommunityReply,
	TCommunityPostContent,
	TPrayerRequestStatus,
} from './community-post.types';

export type TCommunityPostReasonCode =
	| 'AuthenticationRequired'
	| 'EmailVerificationRequired'
	| 'InvalidInput'
	| 'InvalidCursor'
	| 'AccountUnavailable'
	| 'CommunityUnavailable'
	| 'CommunityClosed'
	| 'MembershipUnavailable'
	| 'OrganizerRequired'
	| 'PostUnavailable'
	| 'PostAuthorRequired'
	| 'ReplyUnavailable'
	| 'ReplyAuthorRequired'
	| 'PrayerRequestRequired'
	| 'RevisionConflict'
	| 'OperationPayloadMismatch'
	| 'PostDataUnavailable';

export interface IGetCommunityPostRequest {
	communityId: string;
	postId: string;
}

export interface IGetCommunityPostResult {
	post: ICommunityPost;
}

export interface IListCommunityPostsRequest {
	communityId: string;
	pageSize?: number;
	cursor?: string;
}

export interface IListCommunityPostsResult {
	posts: ICommunityPost[];
	nextCursor: string | null;
}

export interface IListOwnCommunityContributionsRequest {
	pageSize?: number;
	cursor?: string;
}

export interface IOwnCommunityContribution {
	communityId: string;
	postId: string;
	replyId?: string;
	kind: 'Post' | 'Reply';
	publicationStatus: 'Published' | 'AuthorDeleted' | 'ModeratorRemoved';
	revision: number;
	createdAt: IPersistedTimestamp;
	text?: string;
}

export interface IListOwnCommunityContributionsResult {
	contributions: IOwnCommunityContribution[];
	nextCursor: string | null;
}

export interface ICreateCommunityPostRequest {
	communityId: string;
	content: TCommunityPostContent;
	operationId: string;
}

export interface ICreateCommunityPostResult {
	communityId: string;
	postId: string;
	revision: number;
	createdAt: IPersistedTimestamp;
}

// Text edits cannot change the post type or move a shared copy into another audience.
export interface IEditCommunityPostRequest {
	communityId: string;
	postId: string;
	text: string;
	expectedRevision: number;
	operationId: string;
}

export interface IEditCommunityPostResult {
	postId: string;
	revision: number;
	editedAt: IPersistedTimestamp;
}

export interface IDeleteCommunityPostRequest {
	communityId: string;
	postId: string;
	expectedRevision: number;
	operationId: string;
}

export interface IDeleteCommunityPostResult {
	postId: string;
	deletedAt: IPersistedTimestamp;
}

export interface ISetCommunityPrayerRequestStatusRequest {
	communityId: string;
	postId: string;
	prayerRequestStatus: TPrayerRequestStatus;
	expectedRevision: number;
	operationId: string;
}

export interface ISetCommunityPrayerRequestStatusResult {
	postId: string;
	prayerRequestStatus: TPrayerRequestStatus;
	revision: number;
}

export interface ICreateCommunityReplyRequest {
	communityId: string;
	postId: string;
	text: string;
	operationId: string;
}

export interface ICreateCommunityReplyResult {
	postId: string;
	replyId: string;
	revision: number;
	createdAt: IPersistedTimestamp;
}

export interface IEditCommunityReplyRequest {
	communityId: string;
	postId: string;
	replyId: string;
	text: string;
	expectedRevision: number;
	operationId: string;
}

export interface IEditCommunityReplyResult {
	replyId: string;
	revision: number;
	editedAt: IPersistedTimestamp;
}

export interface IDeleteCommunityReplyRequest {
	communityId: string;
	postId: string;
	replyId: string;
	expectedRevision: number;
	operationId: string;
}

export interface IDeleteCommunityReplyResult {
	replyId: string;
	deletedAt: IPersistedTimestamp;
}

export interface IListCommunityRepliesRequest {
	communityId: string;
	postId: string;
	pageSize?: number;
	cursor?: string;
}

export interface IListCommunityRepliesResult {
	replies: ICommunityReply[];
	replyCount: number;
	nextCursor: string | null;
}

export interface ISetCommunityPrayerAcknowledgmentRequest {
	communityId: string;
	postId: string;
	isPraying: boolean;
	operationId: string;
}

export interface ISetCommunityPrayerAcknowledgmentResult {
	postId: string;
	isPraying: boolean;
	revision: number | null;
	updatedAt: IPersistedTimestamp;
}

export interface IListCommunityPrayerSupportRequest {
	communityId: string;
	postId: string;
	pageSize?: number;
	cursor?: string;
}

export interface IListCommunityPrayerSupportResult {
	postId: string;
	supporters: ICommunityPrayerSupporter[];
	supportCount: number;
	viewerIsPraying: boolean;
	nextCursor: string | null;
}
