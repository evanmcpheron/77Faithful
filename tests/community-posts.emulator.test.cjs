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
