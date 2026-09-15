import type { TCommunityPostType } from '@td/types/community/community-post.types';

export interface ICommunityPostDraft {
	postType: TCommunityPostType;
	text: string;
}

const drafts = new Map<string, ICommunityPostDraft>();
let draftAccountId: string | null = null;

export const clearCommunityPostDrafts = (): void => {
	drafts.clear();
	draftAccountId = null;
};

const ensureAccount = (userId: string): void => {
	if (draftAccountId === userId) return;
	drafts.clear();
	draftAccountId = userId;
};

const key = (communityId: string, postId?: string): string =>
	`${communityId}:${postId ?? 'create'}`;

export const getCommunityPostDraft = (
	userId: string,
	communityId: string,
	postId?: string,
): ICommunityPostDraft | null => {
	ensureAccount(userId);
	return drafts.get(key(communityId, postId)) ?? null;
};

export const setCommunityPostDraft = (
	userId: string,
	communityId: string,
	draft: ICommunityPostDraft,
	postId?: string,
): void => {
	ensureAccount(userId);
	drafts.set(key(communityId, postId), draft);
};

export const removeCommunityPostDraft = (
	userId: string,
	communityId: string,
	postId?: string,
): void => {
	ensureAccount(userId);
	drafts.delete(key(communityId, postId));
};
