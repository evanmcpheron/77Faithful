const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const {
	CommunityPostLimits,
	parseCreateCommunityPostRequest,
	parseCreateCommunityReplyRequest,
	parseDeleteCommunityPostRequest,
	parseDeleteCommunityReplyRequest,
	parseEditCommunityPostRequest,
	parseEditCommunityReplyRequest,
	parseGetCommunityPostRequest,
	parseListCommunityPrayerSupportRequest,
	parseListCommunityPostsRequest,
	parseListCommunityRepliesRequest,
	parseSetCommunityPrayerAcknowledgmentRequest,
	parseSetCommunityPrayerRequestStatusRequest,
} = require('../functions/lib/generated/features/communities/community-post');
const posts = require('../functions/lib/src/community/community-post');
const threads = require('../functions/lib/src/community/community-thread');

const contentByType = {
	PrayerRequest: {
		postType: 'PrayerRequest',
		text: 'Please pray for wisdom.',
		prayerRequestStatus: 'Current',
	},
	Discussion: { postType: 'Discussion', text: 'What stood out today?' },
	OrganizerAnnouncement: {
		postType: 'OrganizerAnnouncement',
		text: 'We will meet on Tuesday.',
	},
	SharedReflectionCopy: {
		postType: 'SharedReflectionCopy',
		text: 'This is the copy I chose to share.',
	},
};

test('parses every post type and normalizes only explicitly submitted text', () => {
	for (const [postType, content] of Object.entries(contentByType)) {
		assert.deepEqual(
			parseCreateCommunityPostRequest({
				communityId: 'alpha',
				content: { ...content, text: `  ${content.text}  ` },
				operationId: `create-${postType}`,
			}),
			{
				communityId: 'alpha',
				content,
				operationId: `create-${postType}`,
			},
		);
	}
});

test('rejects private pointers, caller authority, unexpected fields, and invalid prayer state', () => {
	for (const invalidContent of [
		{
			postType: 'SharedReflectionCopy',
			text: 'Copied words.',
			journeyId: 'private-journey',
		},
		{
			postType: 'SharedReflectionCopy',
			text: 'Copied words.',
			dayNumber: 4,
		},
		{
			postType: 'SharedReflectionCopy',
			text: 'Copied words.',
			writingRevisionId: 'private-revision',
		},
		{
			postType: 'PrayerRequest',
			text: 'Already answered.',
			prayerRequestStatus: 'Answered',
		},
	])
		assert.throws(() =>
			parseCreateCommunityPostRequest({
				communityId: 'alpha',
				content: invalidContent,
				operationId: 'create-1',
			}),
		);
	assert.throws(() =>
		parseCreateCommunityPostRequest({
			communityId: 'alpha',
			content: contentByType.Discussion,
			operationId: 'create-1',
			authorUserId: 'forged',
		}),
	);
});

test('rejects blank, oversized, controlled, malformed, and forged edit data', () => {
	for (const text of [
		'',
		'   ',
		'x'.repeat(CommunityPostLimits.text + 1),
		'unsafe\u0000text',
	])
		assert.throws(() =>
			parseCreateCommunityPostRequest({
				communityId: 'alpha',
				content: { postType: 'Discussion', text },
				operationId: 'create-1',
			}),
		);
	assert.throws(() =>
		parseEditCommunityPostRequest({
			communityId: 'alpha',
			postId: 'post-1',
			text: 'Edited',
			expectedRevision: 0,
			operationId: 'edit-1',
			postType: 'OrganizerAnnouncement',
		}),
	);
});

test('parses bounded detail, feed, edit, and delete requests', () => {
	assert.deepEqual(
		parseGetCommunityPostRequest({
			communityId: 'alpha',
			postId: 'post-1',
		}),
		{ communityId: 'alpha', postId: 'post-1' },
	);
	assert.deepEqual(parseListCommunityPostsRequest({ communityId: 'alpha' }), {
		communityId: 'alpha',
		pageSize: 20,
	});
	assert.deepEqual(
		parseListCommunityPostsRequest({
			communityId: 'alpha',
			pageSize: 50,
			cursor: 'opaque_cursor',
		}),
		{ communityId: 'alpha', pageSize: 50, cursor: 'opaque_cursor' },
	);
	assert.deepEqual(
		parseEditCommunityPostRequest({
			communityId: 'alpha',
			postId: 'post-1',
			text: '  Edited words.  ',
			expectedRevision: 2,
			operationId: 'edit-1',
		}),
		{
			communityId: 'alpha',
			postId: 'post-1',
			text: 'Edited words.',
			expectedRevision: 2,
			operationId: 'edit-1',
		},
	);
	assert.deepEqual(
		parseDeleteCommunityPostRequest({
			communityId: 'alpha',
			postId: 'post-1',
			expectedRevision: 3,
			operationId: 'delete-1',
		}),
		{
			communityId: 'alpha',
			postId: 'post-1',
			expectedRevision: 3,
			operationId: 'delete-1',
		},
	);
	for (const invalid of [
		{ communityId: 'alpha', pageSize: 0 },
		{ communityId: 'alpha', pageSize: 51 },
		{ communityId: 'alpha', cursor: 'x'.repeat(513) },
		{ communityId: '../other' },
	])
		assert.throws(() => parseListCommunityPostsRequest(invalid));
});

test('post callables reject missing and unverified authentication', async () => {
	for (const callable of [
		posts.createCommunityPost,
		posts.getCommunityPost,
		posts.listCommunityPosts,
		posts.editCommunityPost,
		posts.deleteCommunityPost,
		threads.createCommunityReply,
		threads.listCommunityReplies,
		threads.editCommunityReply,
		threads.deleteCommunityReply,
		threads.setCommunityPrayerRequestStatus,
		threads.setCommunityPrayerAcknowledgment,
		threads.listCommunityPrayerSupport,
	]) {
		await assert.rejects(callable.run({ data: {} }), {
			code: 'unauthenticated',
		});
		await assert.rejects(
			callable.run({
				data: {},
				auth: { uid: 'member', token: { email_verified: false } },
			}),
			{ code: 'permission-denied' },
		);
	}
});

test('parses bounded reply operations and rejects nested or caller-owned data', () => {
	assert.deepEqual(
		parseListCommunityRepliesRequest({
			communityId: 'alpha',
			postId: 'post-1',
		}),
		{ communityId: 'alpha', postId: 'post-1', pageSize: 20 },
	);
	assert.deepEqual(
		parseCreateCommunityReplyRequest({
			communityId: 'alpha',
			postId: 'post-1',
			text: '  I am praying with you.  ',
			operationId: 'reply-create-1',
		}),
		{
			communityId: 'alpha',
			postId: 'post-1',
			text: 'I am praying with you.',
			operationId: 'reply-create-1',
		},
	);
	assert.deepEqual(
		parseEditCommunityReplyRequest({
			communityId: 'alpha',
			postId: 'post-1',
			replyId: 'reply-1',
			text: 'Edited reply.',
			expectedRevision: 2,
			operationId: 'reply-edit-1',
		}),
		{
			communityId: 'alpha',
			postId: 'post-1',
			replyId: 'reply-1',
			text: 'Edited reply.',
			expectedRevision: 2,
			operationId: 'reply-edit-1',
		},
	);
	assert.deepEqual(
		parseDeleteCommunityReplyRequest({
			communityId: 'alpha',
			postId: 'post-1',
			replyId: 'reply-1',
			expectedRevision: 3,
			operationId: 'reply-delete-1',
		}),
		{
			communityId: 'alpha',
			postId: 'post-1',
			replyId: 'reply-1',
			expectedRevision: 3,
			operationId: 'reply-delete-1',
		},
	);
	for (const invalid of [
		{
			communityId: 'alpha',
			postId: 'post-1',
			parentReplyId: 'reply-1',
			text: 'Nested reply.',
			operationId: 'nested',
		},
		{
			communityId: 'alpha',
			postId: 'post-1',
			text: 'Forged reply.',
			authorUserId: 'other',
			operationId: 'forged',
		},
	])
		assert.throws(() => parseCreateCommunityReplyRequest(invalid));
});

test('parses prayer status and desired-state acknowledgment requests exactly', () => {
	for (const prayerRequestStatus of [
		'Current',
		'NoLongerCurrent',
		'Answered',
	])
		assert.deepEqual(
			parseSetCommunityPrayerRequestStatusRequest({
				communityId: 'alpha',
				postId: 'prayer-1',
				prayerRequestStatus,
				expectedRevision: 1,
				operationId: `status-${prayerRequestStatus}`,
			}),
			{
				communityId: 'alpha',
				postId: 'prayer-1',
				prayerRequestStatus,
				expectedRevision: 1,
				operationId: `status-${prayerRequestStatus}`,
			},
		);
	for (const isPraying of [true, false])
		assert.deepEqual(
			parseSetCommunityPrayerAcknowledgmentRequest({
				communityId: 'alpha',
				postId: 'prayer-1',
				isPraying,
				operationId: `support-${isPraying}`,
			}),
			{
				communityId: 'alpha',
				postId: 'prayer-1',
				isPraying,
				operationId: `support-${isPraying}`,
			},
		);
	assert.deepEqual(
		parseListCommunityPrayerSupportRequest({
			communityId: 'alpha',
			postId: 'prayer-1',
			pageSize: 10,
			cursor: 'safe_cursor',
		}),
		{
			communityId: 'alpha',
			postId: 'prayer-1',
			pageSize: 10,
			cursor: 'safe_cursor',
		},
	);
	for (const invalid of [
		{
			communityId: 'alpha',
			postId: 'prayer-1',
			prayerRequestStatus: 'AssumedAnswered',
			expectedRevision: 1,
			operationId: 'status-invalid',
		},
		{
			communityId: 'alpha',
			postId: 'prayer-1',
			isPraying: true,
			count: 4,
			operationId: 'support-forged',
		},
	]) {
		assert.throws(() =>
			'prayerRequestStatus' in invalid
				? parseSetCommunityPrayerRequestStatusRequest(invalid)
				: parseSetCommunityPrayerAcknowledgmentRequest(invalid),
		);
	}
});

test('post implementation has no logging or private-writing reader path', () => {
	const source = readFileSync(
		'functions/src/community/community-post.ts',
		'utf8',
	);
	assert.doesNotMatch(source, /console\.|logger\.|functions\.logger/);
	assert.doesNotMatch(
		source,
		/journeySetupDrafts|writingRevisions|privateWriting|journeys\//,
	);
	assert.match(source, /requestDigest/);
	assert.doesNotMatch(source, /resultBody|bodyPreview|textPreview/);
	const threadSource = readFileSync(
		'functions/src/community/community-thread.ts',
		'utf8',
	);
	assert.doesNotMatch(threadSource, /console\.|logger\.|functions\.logger/);
	assert.doesNotMatch(
		threadSource,
		/journeySetupDrafts|writingRevisions|privateWriting|journeys\//,
	);
});
