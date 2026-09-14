const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const {
	CommunityPostLimits,
	parseCreateCommunityPostRequest,
	parseDeleteCommunityPostRequest,
	parseEditCommunityPostRequest,
	parseGetCommunityPostRequest,
	parseListCommunityPostsRequest,
} = require('../functions/lib/generated/features/communities/community-post');
const posts = require('../functions/lib/src/community/community-post');

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
});
