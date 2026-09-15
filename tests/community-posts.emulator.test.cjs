const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, beforeEach, test } = require('node:test');
const { deleteApp, getApps, initializeApp } = require(
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
const safety = require('../functions/lib/src/community/community-safety');

const projectId = 'faithful-community-posts-test';
const baseNow = Timestamp.fromMillis(Date.UTC(2026, 8, 14, 15));
const atSecond = (seconds) =>
	Timestamp.fromMillis(baseNow.toMillis() + seconds * 1000);
let database;

const dependencies = (now = baseNow) => ({ database, now });

const clearFirestore = async () => {
	const response = await fetch(
		`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
		{ method: 'DELETE' },
	);
	assert.equal(response.ok, true, await response.text());
};

const seedAccount = async (userId, preferredName = userId) => {
	await database.doc(`users/${userId}`).set({
		schemaVersion: 1,
		revision: 0,
		preferredName,
		createdAt: baseNow,
		updatedAt: baseNow,
	});
};

const membership = (
	communityId,
	userId,
	role = 'Member',
	status = 'Active',
) => ({
	schemaVersion: 1,
	communityId,
	userId,
	role,
	joinedAt: baseNow,
	lifecycle:
		status === 'Active'
			? { status }
			: status === 'Removed'
				? { status, removedAt: baseNow }
				: { status: 'Left', leftAt: baseNow },
	createdAt: baseNow,
	updatedAt: baseNow,
});

const seedMembership = async (
	communityId,
	userId,
	role = 'Member',
	status = 'Active',
) => {
	const value = membership(communityId, userId, role, status);
	await Promise.all([
		database.doc(`communities/${communityId}/members/${userId}`).set(value),
		database
			.doc(`users/${userId}/communityMemberships/${communityId}`)
			.set(value),
	]);
};

const seedCommunity = async (communityId = 'alpha', status = 'Active') => {
	for (const [userId, name] of [
		['owner', 'Organizer'],
		['member-a', 'Member A'],
		['member-b', 'Member B'],
		['outsider', 'Outsider'],
	])
		await seedAccount(userId, name);
	await database.doc(`communities/${communityId}`).set({
		schemaVersion: 1,
		name: 'Community',
		purpose: '',
		organizerUserId: 'owner',
		settings: {},
		lifecycle:
			status === 'Active'
				? { status }
				: { status: 'Closed', closedAt: baseNow },
		activeInvitationId: null,
		revision: 0,
		createdAt: baseNow,
		updatedAt: baseNow,
	});
	await Promise.all([
		seedMembership(communityId, 'owner', 'Organizer'),
		seedMembership(communityId, 'member-a'),
	]);
};

const createRequest = (postType, operationId, text = `${postType} words`) => ({
	communityId: 'alpha',
	content:
		postType === 'PrayerRequest'
			? { postType, text, prayerRequestStatus: 'Current' }
			: { postType, text },
	operationId,
});

before(async () => {
	assert.ok(
		process.env.FIRESTORE_EMULATOR_HOST,
		'Run with the Firestore emulator.',
	);
	initializeApp({ projectId });
	database = getFirestore();
});

beforeEach(clearFirestore);

after(async () => {
	await Promise.all(getApps().map(deleteApp));
});

test('reports all supported targets with exact restricted revision evidence and isolated organizer reports', async () => {
	await seedCommunity();
	const post = await posts.createCommunityPostForAccount(
		'owner',
		createRequest('Discussion', 'reported-post', 'Original words'),
		dependencies(),
	);
	const reply = await threads.createCommunityReplyForAccount(
		'member-a',
		{
			communityId: 'alpha',
			postId: post.postId,
			text: 'Reported reply',
			operationId: 'reported-reply',
		},
		dependencies(atSecond(1)),
	);
	const targets = [
		{ targetType: 'Post', postId: post.postId },
		{ targetType: 'Reply', postId: post.postId, replyId: reply.replyId },
		{ targetType: 'Member', userId: 'owner' },
		{ targetType: 'Community' },
	];
	const receipts = [];
	for (const [index, target] of targets.entries())
		receipts.push(
			await safety.reportCommunityContentForAccount(
				'member-a',
				{
					communityId: 'alpha',
					target,
					reason: 'Harassment',
					operationId: `report-${index}`,
				},
				database,
				atSecond(index + 2),
			),
		);
	assert.equal(receipts.length, 4);
	for (const receipt of receipts) assert.equal(receipt.status, 'Submitted');
	const postEvidence = (
		await database
			.doc(`communitySafetyReports/${receipts[0].reportId}`)
			.get()
	).data();
	assert.equal(postEvidence.evidence.targetRevision, 0);
	assert.equal(postEvidence.evidence.text, 'Original words');
	assert.equal(postEvidence.reporterUserId, 'member-a');
	assert.equal(
		(
			await database
				.doc(`communitySafetyReports/${receipts[1].reportId}`)
				.get()
		).get('evidence.text'),
		'Reported reply',
	);
	await threads.editCommunityReplyForAccount(
		'member-a',
		{
			communityId: 'alpha',
			postId: post.postId,
			replyId: reply.replyId,
			text: 'Changed reply',
			expectedRevision: 0,
			operationId: 'edit-reported-reply',
		},
		dependencies(atSecond(8)),
	);
	assert.equal(
		(
			await database
				.doc(`communitySafetyReports/${receipts[1].reportId}`)
				.get()
		).get('evidence.targetRevision'),
		0,
	);
	assert.equal(
		(
			await database
				.doc(`communitySafetyReports/${receipts[1].reportId}`)
				.get()
		).get('evidence.text'),
		'Reported reply',
	);
	const sameRevision = await safety.reportCommunityContentForAccount(
		'member-a',
		{
			communityId: 'alpha',
			target: targets[0],
			reason: 'Harassment',
			operationId: 'same-revision-report',
		},
		database,
		atSecond(9),
	);
	assert.equal(sameRevision.reportId, receipts[0].reportId);
	await posts.editCommunityPostForAccount(
		'owner',
		{
			communityId: 'alpha',
			postId: post.postId,
			text: 'Changed words',
			expectedRevision: 0,
			operationId: 'edit-reported',
		},
		dependencies(atSecond(10)),
	);
	assert.equal(
		(
			await database
				.doc(`communitySafetyReports/${receipts[0].reportId}`)
				.get()
		).get('evidence.text'),
		'Original words',
	);
	const duplicate = await safety.reportCommunityContentForAccount(
		'member-a',
		{
			communityId: 'alpha',
			target: targets[0],
			reason: 'Harassment',
			operationId: 'report-again',
		},
		database,
		atSecond(11),
	);
	assert.notEqual(duplicate.reportId, receipts[0].reportId); // New post revision is new evidence.
	await assert.rejects(
		safety.reportCommunityContentForAccount(
			'outsider',
			{
				communityId: 'alpha',
				target: targets[0],
				reason: 'Harassment',
				operationId: 'outsider-report',
			},
			database,
		),
		(error) => error.details.reason === 'MembershipUnavailable',
	);
	await assert.rejects(
		safety.reportCommunityContentForAccount(
			'member-a',
			{
				communityId: 'alpha',
				target: { targetType: 'Post', postId: 'arbitrary' },
				reason: 'Other',
				operationId: 'arbitrary-report',
			},
			database,
		),
		(error) => error.details.reason === 'TargetUnavailable',
	);
	assert.equal(
		(
			await database
				.doc(`communitySafetyReports/${receipts[2].reportId}`)
				.get()
		).get('evidence.targetUserId'),
		'owner',
	);
	assert.equal(
		(
			await database
				.doc(`communitySafetyReports/${receipts[2].reportId}`)
				.get()
		).get('evidence.targetRole'),
		'Organizer',
	);
	assert.equal(
		(
			await database
				.doc(`communitySafetyReports/${receipts[3].reportId}`)
				.get()
		).get('evidence.communityName'),
		'Community',
	);
	await database
		.doc('communities/alpha')
		.update({ lifecycle: { status: 'Closed', closedAt: baseNow } });
	const closed = await safety.reportCommunityContentForAccount(
		'member-a',
		{
			communityId: 'alpha',
			target: { targetType: 'Community' },
			reason: 'PrivacyViolation',
			operationId: 'closed-report',
		},
		database,
		atSecond(601),
	);
	assert.equal(closed.status, 'Submitted');
});

test('new reports are rate limited while duplicates recover the first receipt', async () => {
	await seedCommunity();
	const targets = [];
	for (let index = 0; index < 6; index++) {
		const post = await posts.createCommunityPostForAccount(
			'owner',
			createRequest('Discussion', `rate-post-${index}`, `Words ${index}`),
			dependencies(atSecond(index)),
		);
		targets.push({ targetType: 'Post', postId: post.postId });
	}
	for (let index = 0; index < 5; index++)
		await safety.reportCommunityContentForAccount(
			'member-a',
			{
				communityId: 'alpha',
				target: targets[index],
				reason: 'Other',
				operationId: `rate-report-${index}`,
			},
			database,
			atSecond(index),
		);
	await assert.rejects(
		safety.reportCommunityContentForAccount(
			'member-a',
			{
				communityId: 'alpha',
				target: targets[5],
				reason: 'Other',
				operationId: 'rate-report-sixth',
			},
			database,
			atSecond(6),
		),
		(error) => error.details.reason === 'RateLimited',
	);
	const first = await safety.reportCommunityContentForAccount(
		'member-a',
		{
			communityId: 'alpha',
			target: targets[0],
			reason: 'Other',
			operationId: 'rate-report-zero-again',
		},
		database,
		atSecond(7),
	);
	assert.equal(first.status, 'Submitted');
});

test('feed cursor remains usable after a bounded run of hidden posts', async () => {
	await seedCommunity();
	await safety.blockCommunityMemberForAccount(
		'member-a',
		{
			communityId: 'alpha',
			memberUserId: 'owner',
			operationId: 'dense-block',
		},
		database,
	);
	const batch = database.batch();
	for (let index = 0; index < 205; index++)
		batch.set(
			database.doc(
				`communities/alpha/posts/hidden${String(index).padStart(3, '0')}`,
			),
			{
				schemaVersion: 1,
				communityId: 'alpha',
				author: { userId: 'owner', displayName: 'Organizer' },
				revision: 0,
				editedAt: null,
				publication: {
					status: 'Published',
					content: { postType: 'Discussion', text: 'Hidden words' },
				},
				createdAt: atSecond(index + 1),
				updatedAt: atSecond(index + 1),
			},
		);
	batch.set(database.doc('communities/alpha/posts/ownlast'), {
		schemaVersion: 1,
		communityId: 'alpha',
		author: { userId: 'member-a', displayName: 'Member A' },
		revision: 0,
		editedAt: null,
		publication: {
			status: 'Published',
			content: { postType: 'Discussion', text: 'Visible words' },
		},
		createdAt: baseNow,
		updatedAt: baseNow,
	});
	await batch.commit();
	const first = await posts.listCommunityPostsForAccount(
		'member-a',
		{ communityId: 'alpha', pageSize: 50 },
		database,
	);
	assert.equal(first.posts.length, 0);
	assert.ok(first.nextCursor);
	const second = await posts.listCommunityPostsForAccount(
		'member-a',
		{ communityId: 'alpha', pageSize: 50, cursor: first.nextCursor },
		database,
	);
	assert.equal(second.posts[0].publication.content.text, 'Visible words');
});

test('blocks across communities, filters projections, and retains author deletion and Unblock', async () => {
	await seedCommunity();
	await seedCommunity('beta');
	const alpha = await posts.createCommunityPostForAccount(
		'owner',
		createRequest('PrayerRequest', 'alpha-prayer', 'Please pray'),
		dependencies(),
	);
	const beta = await posts.createCommunityPostForAccount(
		'owner',
		{
			...createRequest('Discussion', 'beta-post', 'Words in beta'),
			communityId: 'beta',
		},
		dependencies(atSecond(1)),
	);
	await threads.createCommunityReplyForAccount(
		'owner',
		{
			communityId: 'alpha',
			postId: alpha.postId,
			text: 'Owner reply',
			operationId: 'owner-reply',
		},
		dependencies(atSecond(2)),
	);
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'owner',
		{
			communityId: 'alpha',
			postId: alpha.postId,
			isPraying: true,
			operationId: 'owner-praying',
		},
		dependencies(atSecond(3)),
	);
	const blocked = await safety.blockCommunityMemberForAccount(
		'member-a',
		{
			communityId: 'alpha',
			memberUserId: 'owner',
			operationId: 'block-owner',
		},
		database,
		atSecond(4),
	);
	assert.equal(blocked.isBlocked, true);
	assert.equal(
		(
			await safety.listBlockedCommunityMembersForAccount(
				'member-a',
				{},
				database,
			)
		).members[0].blockedUserId,
		'owner',
	);
	for (const [communityId, postId] of [
		['alpha', alpha.postId],
		['beta', beta.postId],
	]) {
		assert.equal(
			(
				await posts.listCommunityPostsForAccount(
					'member-a',
					{ communityId },
					database,
				)
			).posts.length,
			0,
		);
		await assert.rejects(
			posts.getCommunityPostForAccount(
				'member-a',
				{ communityId, postId },
				database,
			),
			(error) => error.details.reason === 'PostUnavailable',
		);
	}
	await assert.rejects(
		threads.listCommunityRepliesForAccount(
			'member-a',
			{ communityId: 'alpha', postId: alpha.postId },
			database,
		),
		(error) => error.details.reason === 'PostUnavailable',
	);
	await assert.rejects(
		threads.listCommunityPrayerSupportForAccount(
			'member-a',
			{ communityId: 'alpha', postId: alpha.postId },
			database,
		),
		(error) => error.details.reason === 'PostUnavailable',
	);
	await assert.rejects(
		threads.createCommunityReplyForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: alpha.postId,
				text: 'Direct reply',
				operationId: 'blocked-reply',
			},
			dependencies(atSecond(5)),
		),
		(error) => error.details.reason === 'BlockedInteraction',
	);
	await posts.deleteCommunityPostForAccount(
		'owner',
		{
			communityId: 'alpha',
			postId: alpha.postId,
			expectedRevision: 0,
			operationId: 'blocked-author-delete',
		},
		dependencies(atSecond(6)),
	);
	const own = await posts.createCommunityPostForAccount(
		'member-a',
		createRequest('Discussion', 'own-after-block', 'Own words'),
		dependencies(atSecond(6)),
	);
	await posts.deleteCommunityPostForAccount(
		'member-a',
		{
			communityId: 'alpha',
			postId: own.postId,
			expectedRevision: 0,
			operationId: 'own-delete',
		},
		dependencies(atSecond(7)),
	);
	await database
		.doc('communities/alpha/members/owner')
		.update({ lifecycle: { status: 'Left', leftAt: baseNow } });
	assert.equal(
		(
			await safety.listBlockedCommunityMembersForAccount(
				'member-a',
				{},
				database,
			)
		).members.length,
		1,
	);
	assert.equal(
		(
			await safety.unblockCommunityMemberForAccount(
				'member-a',
				{ memberUserId: 'owner', operationId: 'unblock-owner' },
				database,
			)
		).isBlocked,
		false,
	);
	assert.equal(
		(
			await safety.listBlockedCommunityMembersForAccount(
				'member-a',
				{},
				database,
			)
		).members.length,
		0,
	);
	assert.equal(
		(
			await posts.getCommunityPostForAccount(
				'member-a',
				{ communityId: 'beta', postId: beta.postId },
				database,
			)
		).post.postId,
		beta.postId,
	);
});

test('blocked-member list uses owner-bound stable pagination', async () => {
	await seedCommunity();
	await seedMembership('alpha', 'member-b');
	for (const [index, memberUserId] of ['owner', 'member-b'].entries())
		await safety.blockCommunityMemberForAccount(
			'member-a',
			{
				communityId: 'alpha',
				memberUserId,
				operationId: `list-block-${index}`,
			},
			database,
		);
	const first = await safety.listBlockedCommunityMembersForAccount(
		'member-a',
		{ pageSize: 1 },
		database,
	);
	assert.equal(first.members.length, 1);
	assert.ok(first.nextCursor);
	const second = await safety.listBlockedCommunityMembersForAccount(
		'member-a',
		{ pageSize: 1, cursor: first.nextCursor },
		database,
	);
	assert.equal(second.members.length, 1);
	assert.notEqual(
		first.members[0].blockedUserId,
		second.members[0].blockedUserId,
	);
	assert.equal(second.nextCursor, null);
	await assert.rejects(
		safety.listBlockedCommunityMembersForAccount(
			'outsider',
			{ cursor: first.nextCursor },
			database,
		),
		(error) => error.details.reason === 'InvalidCursor',
	);
});

test('blocked reply and prayer supporters are removed from an otherwise visible thread', async () => {
	await seedCommunity();
	const parent = await posts.createCommunityPostForAccount(
		'member-a',
		createRequest(
			'PrayerRequest',
			'visible-parent',
			'Please pray for our neighbors',
		),
		dependencies(),
	);
	await threads.createCommunityReplyForAccount(
		'owner',
		{
			communityId: 'alpha',
			postId: parent.postId,
			text: 'Owner words',
			operationId: 'owner-words',
		},
		dependencies(atSecond(1)),
	);
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'owner',
		{
			communityId: 'alpha',
			postId: parent.postId,
			isPraying: true,
			operationId: 'owner-support',
		},
		dependencies(atSecond(2)),
	);
	await safety.blockCommunityMemberForAccount(
		'member-a',
		{
			communityId: 'alpha',
			memberUserId: 'owner',
			operationId: 'filter-owner',
		},
		database,
	);
	const replies = await threads.listCommunityRepliesForAccount(
		'member-a',
		{ communityId: 'alpha', postId: parent.postId },
		database,
	);
	assert.equal(replies.replies.length, 0);
	assert.equal(replies.replyCount, 0);
	const support = await threads.listCommunityPrayerSupportForAccount(
		'member-a',
		{ communityId: 'alpha', postId: parent.postId },
		database,
	);
	assert.equal(support.supporters.length, 0);
	assert.equal(support.supportCount, 0);
	await assert.rejects(
		threads.createCommunityReplyForAccount(
			'owner',
			{
				communityId: 'alpha',
				postId: parent.postId,
				text: 'More owner words',
				operationId: 'direct-denied',
			},
			dependencies(atSecond(3)),
		),
		(error) => error.details.reason === 'BlockedInteraction',
	);
});

test('submission policy permits Christian vocabulary and denies obvious harmful text', async () => {
	await seedCommunity();
	await posts.createCommunityPostForAccount(
		'member-a',
		createRequest(
			'Discussion',
			'scripture-text',
			'Jesus Christ offers grace. Scripture calls us to pray.',
		),
		dependencies(),
	);
	await assert.rejects(
		posts.createCommunityPostForAccount(
			'member-a',
			createRequest(
				'Discussion',
				'harmful-text',
				'Send me your bank login now.',
			),
			dependencies(atSecond(1)),
		),
		(error) => error.details.reason === 'SubmissionRejected',
	);
});

test('submission budget limits repeated public text without scanning private writing', async () => {
	await seedCommunity();
	await database
		.doc('users/member-a/journeys/private/days/1/writing/reflection')
		.set({ text: 'Private words' });
	for (let index = 0; index < 10; index++)
		await posts.createCommunityPostForAccount(
			'member-a',
			createRequest(
				'Discussion',
				`budget-${index}`,
				`Good words ${index}`,
			),
			dependencies(atSecond(index)),
		);
	await assert.rejects(
		posts.createCommunityPostForAccount(
			'member-a',
			createRequest('Discussion', 'budget-eleven', 'More words'),
			dependencies(atSecond(11)),
		),
		(error) => error.details.reason === 'RateLimited',
	);
	assert.equal(
		(
			await database
				.doc(
					'users/member-a/journeys/private/days/1/writing/reflection',
				)
				.get()
		).get('text'),
		'Private words',
	);
});

test('creates all four explicit types while enforcing announcement authority and private separation', async () => {
	await seedCommunity();
	const privateReflection = {
		text: 'Never read by a community function.',
		journeyId: 'private-journey',
		dayNumber: 4,
	};
	await database
		.doc('users/member-a/journeys/private/days/4/writing/reflection')
		.set(privateReflection);

	const results = [];
	for (const [index, postType] of [
		'PrayerRequest',
		'Discussion',
		'SharedReflectionCopy',
	].entries())
		results.push(
			await posts.createCommunityPostForAccount(
				'member-a',
				createRequest(postType, `create-${postType}`),
				dependencies(atSecond(index + 1)),
			),
		);
	results.push(
		await posts.createCommunityPostForAccount(
			'owner',
			createRequest('OrganizerAnnouncement', 'create-announcement'),
			dependencies(atSecond(4)),
		),
	);
	assert.equal(results.length, 4);
	await assert.rejects(
		posts.createCommunityPostForAccount(
			'member-a',
			createRequest('OrganizerAnnouncement', 'forged-announcement'),
			dependencies(atSecond(5)),
		),
		(error) => error.details.reason === 'OrganizerRequired',
	);
	assert.deepEqual(
		(
			await database
				.doc(
					'users/member-a/journeys/private/days/4/writing/reflection',
				)
				.get()
		).data(),
		privateReflection,
	);
	const contributions = await database
		.collection('users/member-a/communityPostContributions')
		.get();
	assert.equal(contributions.size, 3);
	for (const contribution of contributions.docs) {
		assert.equal(
			JSON.stringify(contribution.data()).includes('words'),
			false,
		);
		assert.deepEqual(
			Object.keys(contribution.data()).sort(),
			[
				'communityId',
				'createdAt',
				'postId',
				'postType',
				'publicationStatus',
				'schemaVersion',
				'updatedAt',
				'userId',
			].sort(),
		);
	}
});

test('replays uncertain creation without duplication or body copies and rechecks changed roles', async () => {
	await seedCommunity();
	const request = createRequest(
		'Discussion',
		'create-once',
		'One body only.',
	);
	const first = await posts.createCommunityPostForAccount(
		'member-a',
		request,
		dependencies(atSecond(1)),
	);
	assert.deepEqual(
		await posts.createCommunityPostForAccount(
			'member-a',
			request,
			dependencies(atSecond(2)),
		),
		first,
	);
	assert.equal(
		(await database.collection('communities/alpha/posts').get()).size,
		1,
	);
	const receipt = (
		await database
			.doc('users/member-a/communityPostCreateOperations/create-once')
			.get()
	).data();
	assert.equal(JSON.stringify(receipt).includes('One body only.'), false);
	await assert.rejects(
		posts.createCommunityPostForAccount(
			'member-a',
			{
				...request,
				content: { ...request.content, text: 'Changed body.' },
			},
			dependencies(atSecond(3)),
		),
		(error) => error.details.reason === 'OperationPayloadMismatch',
	);

	const announcement = createRequest(
		'OrganizerAnnouncement',
		'announcement-once',
	);
	await posts.createCommunityPostForAccount(
		'owner',
		announcement,
		dependencies(atSecond(4)),
	);
	await Promise.all([
		database
			.doc('communities/alpha')
			.update({ organizerUserId: 'member-a' }),
		seedMembership('alpha', 'owner', 'Member'),
		seedMembership('alpha', 'member-a', 'Organizer'),
	]);
	await assert.rejects(
		posts.createCommunityPostForAccount(
			'owner',
			announcement,
			dependencies(atSecond(5)),
		),
		(error) => error.details.reason === 'OrganizerRequired',
	);
});

test('lists newest-first stable pages, includes pre-join history, and scopes IDs and cursors', async () => {
	await seedCommunity();
	await seedCommunity('beta');
	await database.doc('communities/alpha/members/member-b').delete();
	await database.doc('users/member-b/communityMemberships/alpha').delete();
	const created = [];
	for (let index = 1; index <= 3; index += 1)
		created.push(
			await posts.createCommunityPostForAccount(
				'owner',
				createRequest('Discussion', `post-${index}`, `Post ${index}`),
				dependencies(atSecond(index)),
			),
		);
	await seedMembership('alpha', 'member-b');
	const first = await posts.listCommunityPostsForAccount(
		'member-b',
		{ communityId: 'alpha', pageSize: 2 },
		database,
	);
	assert.deepEqual(
		first.posts.map((post) => post.publication.content.text),
		['Post 3', 'Post 2'],
	);
	assert.ok(first.nextCursor);
	const second = await posts.listCommunityPostsForAccount(
		'member-b',
		{ communityId: 'alpha', pageSize: 2, cursor: first.nextCursor },
		database,
	);
	assert.deepEqual(
		second.posts.map((post) => post.publication.content.text),
		['Post 1'],
	);
	assert.equal(second.nextCursor, null);
	await assert.rejects(
		posts.listCommunityPostsForAccount(
			'member-a',
			{ communityId: 'beta', cursor: first.nextCursor },
			database,
		),
		(error) => error.details.reason === 'InvalidCursor',
	);
	await assert.rejects(
		posts.getCommunityPostForAccount(
			'member-a',
			{ communityId: 'beta', postId: created[0].postId },
			database,
		),
		(error) => error.details.reason === 'PostUnavailable',
	);
});

test('edits only an eligible author post with revision and announcement-role checks', async () => {
	await seedCommunity();
	const created = await posts.createCommunityPostForAccount(
		'member-a',
		createRequest('Discussion', 'create-edit'),
		dependencies(atSecond(1)),
	);
	const edit = {
		communityId: 'alpha',
		postId: created.postId,
		text: 'Edited words.',
		expectedRevision: 0,
		operationId: 'edit-1',
	};
	const edited = await posts.editCommunityPostForAccount(
		'member-a',
		edit,
		dependencies(atSecond(2)),
	);
	assert.equal(edited.revision, 1);
	assert.deepEqual(
		await posts.editCommunityPostForAccount(
			'member-a',
			edit,
			dependencies(atSecond(3)),
		),
		edited,
	);
	await assert.rejects(
		posts.editCommunityPostForAccount(
			'member-a',
			{ ...edit, operationId: 'stale-edit' },
			dependencies(atSecond(3)),
		),
		(error) => error.details.reason === 'RevisionConflict',
	);
	await assert.rejects(
		posts.editCommunityPostForAccount(
			'owner',
			{ ...edit, expectedRevision: 1, operationId: 'organizer-rewrite' },
			dependencies(atSecond(3)),
		),
		(error) => error.details.reason === 'PostAuthorRequired',
	);

	const announcement = await posts.createCommunityPostForAccount(
		'owner',
		createRequest('OrganizerAnnouncement', 'create-announcement'),
		dependencies(atSecond(4)),
	);
	await Promise.all([
		database
			.doc('communities/alpha')
			.update({ organizerUserId: 'member-a' }),
		seedMembership('alpha', 'owner', 'Member'),
		seedMembership('alpha', 'member-a', 'Organizer'),
	]);
	await assert.rejects(
		posts.editCommunityPostForAccount(
			'owner',
			{
				communityId: 'alpha',
				postId: announcement.postId,
				text: 'Former organizer edit.',
				expectedRevision: 0,
				operationId: 'former-organizer-edit',
			},
			dependencies(atSecond(5)),
		),
		(error) => error.details.reason === 'OrganizerRequired',
	);
});

test('closed archives remain readable, block new activity, and removed members lose every reader', async () => {
	await seedCommunity();
	const created = await posts.createCommunityPostForAccount(
		'member-a',
		createRequest('Discussion', 'before-close'),
		dependencies(atSecond(1)),
	);
	await database.doc('communities/alpha').update({
		lifecycle: { status: 'Closed', closedAt: atSecond(2) },
	});
	assert.equal(
		(
			await posts.getCommunityPostForAccount(
				'member-a',
				{ communityId: 'alpha', postId: created.postId },
				database,
			)
		).post.publication.content.text,
		'Discussion words',
	);
	assert.equal(
		(
			await posts.listCommunityPostsForAccount(
				'member-a',
				{ communityId: 'alpha' },
				database,
			)
		).posts.length,
		1,
	);
	for (const action of [
		() =>
			posts.createCommunityPostForAccount(
				'member-a',
				createRequest('Discussion', 'after-close'),
				dependencies(atSecond(3)),
			),
		() =>
			posts.editCommunityPostForAccount(
				'member-a',
				{
					communityId: 'alpha',
					postId: created.postId,
					text: 'Closed edit.',
					expectedRevision: 0,
					operationId: 'closed-edit',
				},
				dependencies(atSecond(3)),
			),
	])
		await assert.rejects(action(), (error) =>
			['CommunityClosed'].includes(error.details.reason),
		);

	await seedMembership('alpha', 'member-a', 'Member', 'Removed');
	for (const action of [
		() =>
			posts.getCommunityPostForAccount(
				'member-a',
				{ communityId: 'alpha', postId: created.postId },
				database,
			),
		() =>
			posts.listCommunityPostsForAccount(
				'member-a',
				{ communityId: 'alpha' },
				database,
			),
	])
		await assert.rejects(
			action(),
			(error) => error.details.reason === 'MembershipUnavailable',
		);
});

test('author deletion is body-free everywhere and independent from a private source', async () => {
	await seedCommunity();
	const privatePath =
		'users/member-a/journeys/private/days/4/writing/reflection';
	const privateReflection = { text: 'Original private words.', revision: 2 };
	await database.doc(privatePath).set(privateReflection);
	const created = await posts.createCommunityPostForAccount(
		'member-a',
		createRequest(
			'SharedReflectionCopy',
			'create-copy',
			'A separately submitted copy.',
		),
		dependencies(atSecond(1)),
	);
	await database
		.doc(privatePath)
		.update({ text: 'Private edit only.', revision: 3 });
	assert.equal(
		(
			await posts.getCommunityPostForAccount(
				'member-a',
				{ communityId: 'alpha', postId: created.postId },
				database,
			)
		).post.publication.content.text,
		'A separately submitted copy.',
	);
	await seedMembership('alpha', 'member-a', 'Member', 'Removed');
	const request = {
		communityId: 'alpha',
		postId: created.postId,
		expectedRevision: 0,
		operationId: 'delete-copy',
	};
	const deleted = await posts.deleteCommunityPostForAccount(
		'member-a',
		request,
		dependencies(atSecond(2)),
	);
	assert.deepEqual(
		await posts.deleteCommunityPostForAccount(
			'member-a',
			request,
			dependencies(atSecond(3)),
		),
		deleted,
	);
	const postData = (
		await database.doc(`communities/alpha/posts/${created.postId}`).get()
	).data();
	assert.equal(postData.publication.status, 'AuthorDeleted');
	assert.equal('content' in postData.publication, false);
	assert.equal(
		JSON.stringify(postData).includes('separately submitted'),
		false,
	);
	const contribution = (
		await database
			.collection('users/member-a/communityPostContributions')
			.where('postId', '==', created.postId)
			.get()
	).docs[0].data();
	assert.equal(contribution.publicationStatus, 'AuthorDeleted');
	assert.equal(JSON.stringify(contribution).includes('submitted'), false);
	const receipt = (
		await database
			.doc('users/member-a/communityPostDeleteOperations/delete-copy')
			.get()
	).data();
	assert.equal(JSON.stringify(receipt).includes('submitted'), false);
	assert.deepEqual((await database.doc(privatePath).get()).data(), {
		text: 'Private edit only.',
		revision: 3,
	});

	await seedMembership('alpha', 'member-a');
	const tombstone = (
		await posts.getCommunityPostForAccount(
			'member-a',
			{ communityId: 'alpha', postId: created.postId },
			database,
		)
	).post;
	assert.equal(tombstone.publication.status, 'AuthorDeleted');
	assert.equal(JSON.stringify(tombstone).includes('submitted'), false);
	assert.equal(
		JSON.stringify(
			await posts.listCommunityPostsForAccount(
				'member-a',
				{ communityId: 'alpha' },
				database,
			),
		).includes('submitted'),
		false,
	);
});

test('replies are one-level, oldest-first, retry-safe, author-controlled, and retained under a deleted parent', async () => {
	await seedCommunity();
	await seedCommunity('beta');
	const privatePracticePath =
		'users/member-a/journeys/private/days/1/practices/pray';
	const privatePractice = { isComplete: false, privateChoice: true };
	await database.doc(privatePracticePath).set(privatePractice);
	const parent = await posts.createCommunityPostForAccount(
		'member-a',
		createRequest('Discussion', 'reply-parent'),
		dependencies(atSecond(1)),
	);
	const createdReplies = [];
	for (let index = 1; index <= 3; index += 1)
		createdReplies.push(
			await threads.createCommunityReplyForAccount(
				'member-a',
				{
					communityId: 'alpha',
					postId: parent.postId,
					text: `Reply ${index}`,
					operationId: `reply-${index}`,
				},
				dependencies(atSecond(index + 1)),
			),
		);
	assert.deepEqual(
		await threads.createCommunityReplyForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: parent.postId,
				text: 'Reply 1',
				operationId: 'reply-1',
			},
			dependencies(atSecond(8)),
		),
		createdReplies[0],
	);
	await assert.rejects(
		threads.createCommunityReplyForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: parent.postId,
				text: 'Changed retry body',
				operationId: 'reply-1',
			},
			dependencies(atSecond(9)),
		),
		(error) => error.details.reason === 'OperationPayloadMismatch',
	);
	const firstPage = await threads.listCommunityRepliesForAccount(
		'member-a',
		{ communityId: 'alpha', postId: parent.postId, pageSize: 2 },
		database,
	);
	assert.deepEqual(
		firstPage.replies.map((reply) => reply.publication.text),
		['Reply 1', 'Reply 2'],
	);
	assert.equal(firstPage.replyCount, 3);
	assert.ok(firstPage.nextCursor);
	const secondPage = await threads.listCommunityRepliesForAccount(
		'member-a',
		{
			communityId: 'alpha',
			postId: parent.postId,
			pageSize: 2,
			cursor: firstPage.nextCursor,
		},
		database,
	);
	assert.deepEqual(
		secondPage.replies.map((reply) => reply.publication.text),
		['Reply 3'],
	);
	await assert.rejects(
		threads.listCommunityRepliesForAccount(
			'member-a',
			{
				communityId: 'beta',
				postId: parent.postId,
				cursor: firstPage.nextCursor,
			},
			database,
		),
		(error) =>
			['InvalidCursor', 'PostUnavailable'].includes(error.details.reason),
	);
	await assert.rejects(
		threads.createCommunityReplyForAccount(
			'member-a',
			{
				communityId: 'beta',
				postId: parent.postId,
				text: 'Wrong parent community',
				operationId: 'reply-parent-community-mismatch',
			},
			dependencies(atSecond(9)),
		),
		(error) => error.details.reason === 'PostUnavailable',
	);
	await assert.rejects(
		threads.editCommunityReplyForAccount(
			'owner',
			{
				communityId: 'alpha',
				postId: parent.postId,
				replyId: createdReplies[0].replyId,
				text: 'Organizer rewrite',
				expectedRevision: 0,
				operationId: 'organizer-rewrite-reply',
			},
			dependencies(atSecond(10)),
		),
		(error) => error.details.reason === 'ReplyAuthorRequired',
	);
	const edited = await threads.editCommunityReplyForAccount(
		'member-a',
		{
			communityId: 'alpha',
			postId: parent.postId,
			replyId: createdReplies[0].replyId,
			text: 'Edited reply',
			expectedRevision: 0,
			operationId: 'edit-own-reply',
		},
		dependencies(atSecond(11)),
	);
	assert.equal(edited.revision, 1);
	await assert.rejects(
		threads.editCommunityReplyForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: parent.postId,
				replyId: createdReplies[0].replyId,
				text: 'Stale edit',
				expectedRevision: 0,
				operationId: 'stale-reply-edit',
			},
			dependencies(atSecond(12)),
		),
		(error) => error.details.reason === 'RevisionConflict',
	);
	await posts.deleteCommunityPostForAccount(
		'member-a',
		{
			communityId: 'alpha',
			postId: parent.postId,
			expectedRevision: 0,
			operationId: 'delete-reply-parent',
		},
		dependencies(atSecond(13)),
	);
	assert.equal(
		(
			await threads.listCommunityRepliesForAccount(
				'member-a',
				{ communityId: 'alpha', postId: parent.postId },
				database,
			)
		).replyCount,
		3,
	);
	await assert.rejects(
		threads.createCommunityReplyForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: parent.postId,
				text: 'Too late',
				operationId: 'reply-after-parent-delete',
			},
			dependencies(atSecond(14)),
		),
		(error) => error.details.reason === 'PostUnavailable',
	);
	await seedMembership('alpha', 'member-a', 'Member', 'Removed');
	const deletedReply = await threads.deleteCommunityReplyForAccount(
		'member-a',
		{
			communityId: 'alpha',
			postId: parent.postId,
			replyId: createdReplies[0].replyId,
			expectedRevision: 1,
			operationId: 'delete-own-reply-after-removal',
		},
		dependencies(atSecond(15)),
	);
	assert.equal(deletedReply.replyId, createdReplies[0].replyId);
	assert.deepEqual(
		(await database.doc(privatePracticePath).get()).data(),
		privatePractice,
	);
});

test('prayer status is author-reported, revision-protected, and never changes practice completion', async () => {
	await seedCommunity();
	const privatePracticePath =
		'users/member-a/journeys/private/days/1/practices/pray';
	const privatePractice = { isComplete: false };
	await database.doc(privatePracticePath).set(privatePractice);
	const prayer = await posts.createCommunityPostForAccount(
		'member-a',
		createRequest('PrayerRequest', 'status-parent'),
		dependencies(atSecond(1)),
	);
	const noLongerCurrent =
		await threads.setCommunityPrayerRequestStatusForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: prayer.postId,
				prayerRequestStatus: 'NoLongerCurrent',
				expectedRevision: 0,
				operationId: 'status-no-longer-current',
			},
			dependencies(atSecond(2)),
		);
	assert.equal(noLongerCurrent.revision, 1);
	assert.deepEqual(
		await threads.setCommunityPrayerRequestStatusForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: prayer.postId,
				prayerRequestStatus: 'NoLongerCurrent',
				expectedRevision: 0,
				operationId: 'status-no-longer-current',
			},
			dependencies(atSecond(3)),
		),
		noLongerCurrent,
	);
	await assert.rejects(
		threads.setCommunityPrayerRequestStatusForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: prayer.postId,
				prayerRequestStatus: 'Answered',
				expectedRevision: 0,
				operationId: 'stale-prayer-status',
			},
			dependencies(atSecond(4)),
		),
		(error) => error.details.reason === 'RevisionConflict',
	);
	await assert.rejects(
		threads.setCommunityPrayerRequestStatusForAccount(
			'owner',
			{
				communityId: 'alpha',
				postId: prayer.postId,
				prayerRequestStatus: 'Answered',
				expectedRevision: 1,
				operationId: 'other-author-status',
			},
			dependencies(atSecond(5)),
		),
		(error) => error.details.reason === 'PostAuthorRequired',
	);
	const answered = await threads.setCommunityPrayerRequestStatusForAccount(
		'member-a',
		{
			communityId: 'alpha',
			postId: prayer.postId,
			prayerRequestStatus: 'Answered',
			expectedRevision: 1,
			operationId: 'status-answered',
		},
		dependencies(atSecond(6)),
	);
	assert.equal(answered.revision, 2);
	assert.deepEqual(
		(await database.doc(privatePracticePath).get()).data(),
		privatePractice,
	);
	await database.doc('communities/alpha').update({
		lifecycle: { status: 'Closed', closedAt: atSecond(7) },
	});
	await assert.rejects(
		threads.setCommunityPrayerRequestStatusForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: prayer.postId,
				prayerRequestStatus: 'Current',
				expectedRevision: 2,
				operationId: 'status-after-close',
			},
			dependencies(atSecond(8)),
		),
		(error) => error.details.reason === 'CommunityClosed',
	);
});

test('prayer support is desired-state, reversible, retry-safe, membership-filtered, and first-notification stable', async () => {
	await seedCommunity();
	const prayer = await posts.createCommunityPostForAccount(
		'member-a',
		createRequest('PrayerRequest', 'support-parent'),
		dependencies(atSecond(1)),
	);
	const supportRequest = {
		communityId: 'alpha',
		postId: prayer.postId,
		isPraying: true,
		operationId: 'support-owner',
	};
	const [first, concurrent] = await Promise.all([
		threads.setCommunityPrayerAcknowledgmentForAccount(
			'owner',
			supportRequest,
			dependencies(atSecond(2)),
		),
		threads.setCommunityPrayerAcknowledgmentForAccount(
			'owner',
			{ ...supportRequest, operationId: 'support-owner-concurrent' },
			dependencies(atSecond(3)),
		),
	]);
	assert.equal(first.isPraying, true);
	assert.equal(concurrent.isPraying, true);
	assert.equal(
		(
			await database
				.collection(
					`communities/alpha/posts/${prayer.postId}/prayerAcknowledgments`,
				)
				.get()
		).size,
		1,
	);
	const initialDocument = (
		await database
			.doc(
				`communities/alpha/posts/${prayer.postId}/prayerAcknowledgments/owner`,
			)
			.get()
	).data();
	const firstNotificationEligibleAt =
		initialDocument.firstNotificationEligibleAt;
	let support = await threads.listCommunityPrayerSupportForAccount(
		'member-a',
		{ communityId: 'alpha', postId: prayer.postId, pageSize: 1 },
		database,
	);
	assert.equal(support.supportCount, 1);
	assert.equal(support.supporters[0].displayName, 'Organizer');
	assert.equal(support.viewerIsPraying, false);
	await seedMembership('alpha', 'member-b');
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'member-a',
		{
			...supportRequest,
			operationId: 'support-member-a',
		},
		dependencies(atSecond(4)),
	);
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'member-b',
		{
			...supportRequest,
			operationId: 'support-member-b',
		},
		dependencies(atSecond(5)),
	);
	support = await threads.listCommunityPrayerSupportForAccount(
		'member-a',
		{ communityId: 'alpha', postId: prayer.postId, pageSize: 1 },
		database,
	);
	assert.equal(support.supportCount, 3);
	assert.equal(support.viewerIsPraying, true);
	assert.ok(support.nextCursor);
	const secondSupportPage =
		await threads.listCommunityPrayerSupportForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: prayer.postId,
				pageSize: 1,
				cursor: support.nextCursor,
			},
			database,
		);
	assert.equal(secondSupportPage.supportCount, 3);
	assert.equal(secondSupportPage.supporters.length, 1);
	const withdrawn = await threads.setCommunityPrayerAcknowledgmentForAccount(
		'owner',
		{
			communityId: 'alpha',
			postId: prayer.postId,
			isPraying: false,
			operationId: 'withdraw-owner',
		},
		dependencies(atSecond(6)),
	);
	assert.equal(withdrawn.isPraying, false);
	assert.deepEqual(
		await threads.setCommunityPrayerAcknowledgmentForAccount(
			'owner',
			{
				communityId: 'alpha',
				postId: prayer.postId,
				isPraying: false,
				operationId: 'withdraw-owner',
			},
			dependencies(atSecond(7)),
		),
		withdrawn,
	);
	support = await threads.listCommunityPrayerSupportForAccount(
		'member-a',
		{ communityId: 'alpha', postId: prayer.postId },
		database,
	);
	assert.equal(support.supportCount, 2);
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'owner',
		{ ...supportRequest, operationId: 'support-owner-again' },
		dependencies(atSecond(8)),
	);
	const reactivatedDocument = (
		await database
			.doc(
				`communities/alpha/posts/${prayer.postId}/prayerAcknowledgments/owner`,
			)
			.get()
	).data();
	assert.deepEqual(
		reactivatedDocument.firstNotificationEligibleAt,
		firstNotificationEligibleAt,
	);
	await seedMembership('alpha', 'owner', 'Organizer', 'Removed');
	support = await threads.listCommunityPrayerSupportForAccount(
		'member-a',
		{ communityId: 'alpha', postId: prayer.postId },
		database,
	);
	assert.equal(support.supportCount, 2);
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'owner',
		{
			communityId: 'alpha',
			postId: prayer.postId,
			isPraying: false,
			operationId: 'withdraw-after-removal',
		},
		dependencies(atSecond(9)),
	);
	await assert.rejects(
		threads.setCommunityPrayerAcknowledgmentForAccount(
			'owner',
			{ ...supportRequest, operationId: 'support-after-removal' },
			dependencies(atSecond(10)),
		),
		(error) => error.details.reason === 'MembershipUnavailable',
	);
});

test('non-current, answered, deleted, and closed prayer requests reject new support while withdrawal remains available', async () => {
	await seedCommunity();
	const prayer = await posts.createCommunityPostForAccount(
		'member-a',
		createRequest('PrayerRequest', 'support-lifecycle-parent'),
		dependencies(atSecond(1)),
	);
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'owner',
		{
			communityId: 'alpha',
			postId: prayer.postId,
			isPraying: true,
			operationId: 'initial-support',
		},
		dependencies(atSecond(2)),
	);
	await threads.setCommunityPrayerRequestStatusForAccount(
		'member-a',
		{
			communityId: 'alpha',
			postId: prayer.postId,
			prayerRequestStatus: 'NoLongerCurrent',
			expectedRevision: 0,
			operationId: 'make-non-current',
		},
		dependencies(atSecond(3)),
	);
	await assert.rejects(
		threads.setCommunityPrayerAcknowledgmentForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: prayer.postId,
				isPraying: true,
				operationId: 'support-non-current',
			},
			dependencies(atSecond(4)),
		),
		(error) => error.details.reason === 'PrayerRequestRequired',
	);
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'owner',
		{
			communityId: 'alpha',
			postId: prayer.postId,
			isPraying: false,
			operationId: 'withdraw-non-current',
		},
		dependencies(atSecond(5)),
	);
	await threads.setCommunityPrayerRequestStatusForAccount(
		'member-a',
		{
			communityId: 'alpha',
			postId: prayer.postId,
			prayerRequestStatus: 'Answered',
			expectedRevision: 1,
			operationId: 'make-answered',
		},
		dependencies(atSecond(6)),
	);
	await assert.rejects(
		threads.setCommunityPrayerAcknowledgmentForAccount(
			'owner',
			{
				communityId: 'alpha',
				postId: prayer.postId,
				isPraying: true,
				operationId: 'support-answered',
			},
			dependencies(atSecond(7)),
		),
		(error) => error.details.reason === 'PrayerRequestRequired',
	);
	await posts.deleteCommunityPostForAccount(
		'member-a',
		{
			communityId: 'alpha',
			postId: prayer.postId,
			expectedRevision: 2,
			operationId: 'delete-prayer',
		},
		dependencies(atSecond(8)),
	);
	await assert.rejects(
		threads.setCommunityPrayerAcknowledgmentForAccount(
			'member-a',
			{
				communityId: 'alpha',
				postId: prayer.postId,
				isPraying: true,
				operationId: 'support-deleted',
			},
			dependencies(atSecond(9)),
		),
		(error) => error.details.reason === 'PrayerRequestRequired',
	);
	const currentAtClosure = await posts.createCommunityPostForAccount(
		'member-a',
		createRequest('PrayerRequest', 'current-at-close'),
		dependencies(atSecond(10)),
	);
	await database.doc('communities/alpha').update({
		lifecycle: { status: 'Closed', closedAt: atSecond(11) },
	});
	await assert.rejects(
		threads.setCommunityPrayerAcknowledgmentForAccount(
			'owner',
			{
				communityId: 'alpha',
				postId: currentAtClosure.postId,
				isPraying: true,
				operationId: 'support-after-close',
			},
			dependencies(atSecond(12)),
		),
		(error) => error.details.reason === 'CommunityClosed',
	);
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'owner',
		{
			communityId: 'alpha',
			postId: prayer.postId,
			isPraying: false,
			operationId: 'withdraw-closed',
		},
		dependencies(atSecond(13)),
	);
});
