const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
	createCommunityForAccount,
	createCommunity,
} = require('../functions/lib/src/community/create-community');
const {
	parseCreateCommunityRequest,
	parseCreateCommunityResult,
} = require('../functions/lib/generated/features/communities/community-creation');
const input = {
	name: ' Grace Church ',
	purpose: '',
	settings: {},
	operationId: 'operation-1',
};
const databaseFixture = () => {
	const documents = new Map([
		[
			'users/owner',
			{
				preferredName: 'Anna',
				contactEmail: 'private@example.com',
			},
		],
	]);
	let nextId = 0;
	let failCommit = false;
	class Reference {
		constructor(path) {
			this.path = path;
			this.id = path.split('/').at(-1);
		}
		collection(name) {
			return new Reference(`${this.path}/${name}`);
		}
		doc(id = `community-${++nextId}`) {
			return new Reference(`${this.path}/${id}`);
		}
	}
	const database = {
		doc: (path) => new Reference(path),
		collection: (path) => new Reference(path),
		runTransaction: async (callback) => {
			for (let attempt = 0; attempt < 5; attempt++) {
				const reads = new Map();
				const writes = [];
				const result = await callback({
					get: async (reference) => {
						assert.equal(writes.length, 0);
						if (reference.path.split('/').length % 2 === 1) {
							return {
								docs: [...documents.entries()]
									.filter(
										([path]) =>
											path.startsWith(
												reference.path + '/',
											) &&
											path.split('/').length ===
												reference.path.split('/')
													.length +
													1,
									)
									.map(([path, data]) => ({
										id: path.split('/').at(-1),
										data: () => data,
									})),
							};
						}
						reads.set(
							reference.path,
							documents.get(reference.path),
						);
						return {
							exists: documents.has(reference.path),
							data: () => documents.get(reference.path),
						};
					},
					create: (reference, value) => {
						writes.push([reference.path, value]);
					},
				});
				if (
					[...reads].some(
						([path, value]) => documents.get(path) !== value,
					)
				)
					continue;
				if (failCommit) throw new Error('Failed commit');
				for (const [path] of writes)
					assert.equal(documents.has(path), false);
				for (const [path, value] of writes) documents.set(path, value);
				return result;
			}
			throw new Error('Contention');
		},
	};
	return {
		database,
		documents,
		fail: () => {
			failCommit = true;
		},
	};
};
test('validates request fields and rejects unsupported privilege or privacy fields', () => {
	assert.equal(parseCreateCommunityRequest(input).name, 'Grace Church');
	for (const value of [
		{ ...input, name: ' ' },
		{ ...input, organizerDisplayName: '' },
		{ ...input, purpose: null },
		{ ...input, name: 'a'.repeat(101) },
		{ ...input, purpose: 'a'.repeat(2001) },
		{ ...input, operationId: '../owner' },
		{ ...input, userId: 'other' },
		{ ...input, settings: { privacy: 'public' } },
	])
		assert.throws(() => parseCreateCommunityRequest(value));
	assert.throws(() =>
		parseCreateCommunityResult({ community: { status: 'Active' } }),
	);
});
test('rejects unauthenticated and unconfirmed callers', async () => {
	await assert.rejects(createCommunity.run({ data: input }), {
		code: 'unauthenticated',
	});
	await assert.rejects(
		createCommunity.run({
			data: input,
			auth: { uid: 'owner', token: { email_verified: false } },
		}),
		{ code: 'permission-denied' },
	);
});
test('atomically creates private community and organizer membership without publishing private profile data', async () => {
	const { database, documents } = databaseFixture();
	const result = await createCommunityForAccount('owner', input, database);
	const community = documents.get(
		`communities/${result.community.communityId}`,
	);
	const member = documents.get(
		`communities/${result.community.communityId}/members/owner`,
	);
	assert.equal(community.organizerUserId, 'owner');
	assert.equal(community.purpose, '');
	assert.equal(community.createdAt.constructor.name, 'Timestamp');
	assert.equal(community.revision, 0);
	assert.equal(community.activeInvitationId, null);
	assert.equal(member.role, 'Organizer');
	assert.equal(member.displayName, undefined);
	assert.equal(member.lifecycle.status, 'Active');
	assert.deepEqual(
		documents.get(
			`users/owner/communityMemberships/${result.community.communityId}`,
		),
		member,
	);
	assert.equal(result.community.organizer.displayName, 'Anna');
	for (const [path, document] of documents) {
		if (path !== 'users/owner')
			assert.equal(
				JSON.stringify(document).includes('Anna'),
				false,
				path,
			);
	}
	assert.equal(
		JSON.stringify(community).includes('private@example.com'),
		false,
	);
});
test('concurrent retries create only one community and reject changed payloads', async () => {
	const { database, documents } = databaseFixture();
	const results = await Promise.all([
		createCommunityForAccount('owner', input, database),
		createCommunityForAccount('owner', input, database),
	]);
	assert.deepEqual(results[0], results[1]);
	assert.equal(
		[...documents.keys()].filter((path) =>
			/^communities\/[^/]+$/.test(path),
		).length,
		1,
	);
	await assert.rejects(
		createCommunityForAccount(
			'owner',
			{ ...input, name: 'Different' },
			database,
		),
		{ code: 'already-exists' },
	);
});
test('failed transactions leave no partial community and missing profiles cannot create', async () => {
	const { database, documents, fail } = databaseFixture();
	fail();
	await assert.rejects(createCommunityForAccount('owner', input, database));
	assert.equal(documents.size, 1);
	await assert.rejects(createCommunityForAccount('other', input, database), {
		code: 'failed-precondition',
	});
});

const {
	getCommunityForAccount,
	listCommunitiesForAccount,
	getCommunity,
	listCommunities,
} = require('../functions/lib/src/community/read-community');
test('resolves the current creator name on detail, list, and retry loads without persisting a snapshot', async () => {
	const { database, documents } = databaseFixture();
	const created = await createCommunityForAccount('owner', input, database);
	documents.set('users/owner', {
		preferredName: 'Beth',
		contactEmail: 'private@example.com',
	});
	const detail = await getCommunityForAccount(
		'owner',
		{ communityId: created.community.communityId },
		database,
	);
	const list = await listCommunitiesForAccount('owner', database);
	const retry = await createCommunityForAccount('owner', input, database);
	assert.equal(detail.organizer.displayName, 'Beth');
	assert.deepEqual(list, [detail]);
	assert.deepEqual(retry.community, detail);
	assert.equal(JSON.stringify(detail).includes('private@example.com'), false);
	for (const [path, value] of documents)
		if (path !== 'users/owner')
			assert.equal(JSON.stringify(value).includes('Beth'), false);
	documents.set('users/owner', { preferredName: null });
	assert.equal(
		(
			await getCommunityForAccount(
				'owner',
				{ communityId: detail.communityId },
				database,
			)
		).organizer.displayName,
		'',
	);
});
test('enforces actual membership for reads even when the account index is stale', async () => {
	const { database, documents } = databaseFixture();
	const { community } = await createCommunityForAccount(
		'owner',
		input,
		database,
	);
	documents.set('users/other', { preferredName: 'Other' });
	await assert.rejects(
		getCommunityForAccount(
			'other',
			{ communityId: community.communityId },
			database,
		),
		{ code: 'permission-denied' },
	);
	const path = `communities/${community.communityId}/members/owner`;
	for (const status of ['Leaving', 'Left', 'Removed']) {
		documents.set(path, { ...documents.get(path), lifecycle: { status } });
		await assert.rejects(
			getCommunityForAccount(
				'owner',
				{ communityId: community.communityId },
				database,
			),
			{ code: 'permission-denied' },
		);
		assert.deepEqual(
			await listCommunitiesForAccount('owner', database),
			[],
		);
	}
	await assert.rejects(createCommunityForAccount('owner', input, database), {
		code: 'permission-denied',
	});
});
test('requires a confirmed identity and rejects caller-supplied identities on read endpoints', async () => {
	for (const callable of [getCommunity, listCommunities]) {
		await assert.rejects(callable.run({ data: {} }), {
			code: 'unauthenticated',
		});
		await assert.rejects(
			callable.run({
				data: {},
				auth: { uid: 'owner', token: { email_verified: false } },
			}),
			{ code: 'permission-denied' },
		);
	}
	await assert.rejects(
		listCommunities.run({
			data: { userId: 'other' },
			auth: { uid: 'owner', token: { email_verified: true } },
		}),
		{ code: 'invalid-argument' },
	);
	const { database } = databaseFixture();
	for (const data of [
		null,
		{},
		{ communityId: '../other' },
		{ communityId: 'group', userId: 'other' },
	])
		await assert.rejects(getCommunityForAccount('owner', data, database), {
			code: 'invalid-argument',
		});
});
