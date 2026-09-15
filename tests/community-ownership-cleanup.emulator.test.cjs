const assert = require('node:assert/strict');
const path = require('node:path');
const { before, beforeEach, after, test } = require('node:test');
const { initializeApp, getApps, deleteApp } = require(
	require.resolve('firebase-admin/app', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const { getFirestore, Timestamp } = require(
	require.resolve('firebase-admin/firestore', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const posts = require('../functions/lib/src/community/community-post');
const threads = require('../functions/lib/src/community/community-thread');
const owners = require('../functions/lib/src/community/own-community-contributions');
const administration = require('../functions/lib/src/community/community-administration');
const cleanup = require('../functions/lib/src/community/community-cleanup');

const projectId = 'faithful-community-cleanup-test';
const now = Timestamp.fromMillis(Date.UTC(2026, 8, 15, 15));
let database;

const clear = async () => {
	const response = await fetch(
		`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
		{ method: 'DELETE' },
	);
	assert.equal(response.ok, true, await response.text());
};

const seed = async () => {
	for (const userId of ['owner', 'author', 'other']) {
		await database.doc(`users/${userId}`).set({
			schemaVersion: 1,
			preferredName: userId,
			revision: 0,
			createdAt: now,
			updatedAt: now,
		});
		const member = {
			schemaVersion: 1,
			communityId: 'alpha',
			userId,
			role: userId === 'owner' ? 'Organizer' : 'Member',
			joinedAt: now,
			lifecycle: { status: 'Active' },
			createdAt: now,
			updatedAt: now,
		};
		await database.doc(`communities/alpha/members/${userId}`).set(member);
		await database
			.doc(`users/${userId}/communityMemberships/alpha`)
			.set(member);
	}
	await database.doc('communities/alpha').set({
		schemaVersion: 1,
		name: 'Community',
		purpose: '',
		organizerUserId: 'owner',
		settings: {},
		activeInvitationId: null,
		revision: 0,
		lifecycle: { status: 'Active' },
		createdAt: now,
		updatedAt: now,
	});
};

before(async () => {
	assert.ok(
		process.env.FIRESTORE_EMULATOR_HOST,
		'Run with the Firestore emulator.',
	);
	initializeApp({ projectId });
	database = getFirestore();
});
beforeEach(clear);
after(async () => Promise.all(getApps().map(deleteApp)));

test('author can list and delete posts and replies after leaving without feed access', async () => {
	await seed();
	const post = await posts.createCommunityPostForAccount(
		'author',
		{
			communityId: 'alpha',
			content: { postType: 'Discussion', text: 'Shared words' },
			operationId: 'post-a',
		},
		{ database, now },
	);
	const reply = await threads.createCommunityReplyForAccount(
		'author',
		{
			communityId: 'alpha',
			postId: post.postId,
			text: 'Reply words',
			operationId: 'reply-a',
		},
		{ database, now },
	);
	await administration.leaveCommunityForAccount(
		'author',
		{
			communityId: 'alpha',
			operationId: 'leave-a',
		},
		{ database, now },
	);
	await assert.rejects(
		() =>
			posts.listCommunityPostsForAccount(
				'author',
				{
					communityId: 'alpha',
				},
				database,
			),
		(error) => error.code === 'permission-denied',
	);
	const listed = await owners.listOwnCommunityContributionsForAccount(
		'author',
		{},
		database,
	);
	assert.equal(listed.contributions.length, 2);
	assert.deepEqual(listed.contributions.map((item) => item.text).sort(), [
		'Reply words',
		'Shared words',
	]);
	await threads.deleteCommunityReplyForAccount(
		'author',
		{
			communityId: 'alpha',
			postId: post.postId,
			replyId: reply.replyId,
			expectedRevision: 0,
			operationId: 'delete-reply',
		},
		{ database, now },
	);
	await posts.deleteCommunityPostForAccount(
		'author',
		{
			communityId: 'alpha',
			postId: post.postId,
			expectedRevision: 0,
			operationId: 'delete-post',
		},
		{ database, now },
	);
	const afterDelete = await owners.listOwnCommunityContributionsForAccount(
		'author',
		{},
		database,
	);
	assert.ok(
		afterDelete.contributions.every(
			(item) =>
				item.publicationStatus === 'AuthorDeleted' &&
				item.text === undefined,
		),
	);
});

test('forged author index does not reveal another post or grant outsider access', async () => {
	await seed();
	const post = await posts.createCommunityPostForAccount(
		'author',
		{
			communityId: 'alpha',
			content: { postType: 'Discussion', text: 'Author words' },
			operationId: 'post-a',
		},
		{ database, now },
	);
	await database.doc('users/other/communityPostContributions/forged').set({
		schemaVersion: 1,
		userId: 'other',
		communityId: 'alpha',
		postId: post.postId,
		createdAt: now,
		publicationStatus: 'Published',
	});
	const listed = await owners.listOwnCommunityContributionsForAccount(
		'other',
		{},
		database,
	);
	assert.deepEqual(listed.contributions, []);
	await assert.rejects(
		() =>
			posts.deleteCommunityPostForAccount(
				'other',
				{
					communityId: 'alpha',
					postId: post.postId,
					expectedRevision: 0,
					operationId: 'forged-delete',
				},
				{ database, now },
			),
		(error) => error.code === 'permission-denied',
	);
});

test('reply-only author retains delete access after removal and closure', async () => {
	await seed();
	const parent = await posts.createCommunityPostForAccount(
		'owner',
		{
			communityId: 'alpha',
			content: { postType: 'Discussion', text: 'Parent words' },
			operationId: 'parent-a',
		},
		{ database, now },
	);
	const reply = await threads.createCommunityReplyForAccount(
		'author',
		{
			communityId: 'alpha',
			postId: parent.postId,
			text: 'Reply only',
			operationId: 'reply-only',
		},
		{ database, now },
	);
	await database.doc('users/author/journeys/private').set({ private: true });
	await administration.removeCommunityMemberForAccount(
		'owner',
		{
			communityId: 'alpha',
			memberUserId: 'author',
			privateReason: 'Test reason',
			operationId: 'remove-a',
		},
		{ database, now },
	);
	await administration.closeCommunityForAccount(
		'owner',
		{
			communityId: 'alpha',
			expectedRevision: 0,
			operationId: 'close-a',
		},
		{ database, now },
	);
	const listed = await owners.listOwnCommunityContributionsForAccount(
		'author',
		{},
		database,
	);
	assert.equal(listed.contributions.length, 1);
	assert.equal(listed.contributions[0].text, 'Reply only');
	await threads.deleteCommunityReplyForAccount(
		'author',
		{
			communityId: 'alpha',
			postId: parent.postId,
			replyId: reply.replyId,
			expectedRevision: 0,
			operationId: 'delete-reply',
		},
		{ database, now },
	);
	await assert.rejects(
		() =>
			threads.deleteCommunityReplyForAccount(
				'author',
				{
					communityId: 'alpha',
					postId: parent.postId,
					replyId: reply.replyId,
					expectedRevision: 0,
					operationId: 'new-delete',
				},
				{ database, now },
			),
		(error) => error.code === 'failed-precondition',
	);
	assert.equal(
		(await database.doc('users/author/journeys/private').get()).get(
			'private',
		),
		true,
	);
});

test('account cleanup resumes partial work and closes an orphaned organizer', async () => {
	await seed();
	await database.doc('users/owner/journeys/private').set({ private: true });
	const post = await posts.createCommunityPostForAccount(
		'owner',
		{
			communityId: 'alpha',
			content: {
				postType: 'OrganizerAnnouncement',
				text: 'Shared announcement',
			},
			operationId: 'post-a',
		},
		{ database, now },
	);
	await database
		.doc('communityAccountDeletionCleanup/owner')
		.set({ queuedAt: now });
	for (let attempt = 0; attempt < 8; attempt++)
		await cleanup.processCommunityCleanup(database);
	const community = await database.doc('communities/alpha').get();
	assert.equal(community.get('lifecycle.status'), 'Closed');
	const storedPost = await database
		.doc(`communities/alpha/posts/${post.postId}`)
		.get();
	assert.equal(storedPost.get('publication.status'), 'AuthorDeleted');
	assert.equal(storedPost.get('author.displayName'), 'Former participant');
	assert.equal(
		(await database.doc('users/owner/journeys/private').get()).get(
			'private',
		),
		true,
	);
});

test('exit cleanup removes obsolete support without changing a private journey', async () => {
	await seed();
	await database.doc('users/author/journeys/private').set({ private: true });
	const post = await posts.createCommunityPostForAccount(
		'owner',
		{
			communityId: 'alpha',
			content: {
				postType: 'PrayerRequest',
				text: 'Please pray',
				prayerRequestStatus: 'Current',
			},
			operationId: 'post-a',
		},
		{ database, now },
	);
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'author',
		{
			communityId: 'alpha',
			postId: post.postId,
			isPraying: true,
			operationId: 'support-a',
		},
		{ database, now },
	);
	await administration.removeCommunityMemberForAccount(
		'owner',
		{
			communityId: 'alpha',
			memberUserId: 'author',
			privateReason: 'Test reason',
			operationId: 'remove-a',
		},
		{ database, now },
	);
	await cleanup.processCommunityCleanup(database);
	assert.equal(
		(
			await database
				.doc(
					`communities/alpha/posts/${post.postId}/prayerAcknowledgments/author`,
				)
				.get()
		).exists,
		false,
	);
	assert.equal(
		(await database.doc('users/author/journeys/private').get()).get(
			'private',
		),
		true,
	);
});
