const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const data = require('../scripts/community-qa-data.cjs');
const runtime = require('../scripts/community-qa-runtime.cjs');
const { renderReport, redact } = require('../scripts/community-qa-report.cjs');
const postParser = require('../functions/lib/generated/features/communities/community-post');
const creationParser = require('../functions/lib/generated/features/communities/community-creation');
const {
	CommunitySafetyLimits,
} = require('../functions/lib/generated/features/communities/community-safety');

test('targets exactly the ten requested email addresses, with a coherent ownership and membership graph', () => {
	assert.deepEqual(
		data.accounts.map((account) => account.email),
		Array.from(
			{ length: 10 },
			(_, index) => `77faithful_${index + 1}@yopmail.com`,
		),
	);
	assert.equal(
		new Set(data.accounts.map((account) => account.email)).size,
		10,
	);
	for (const community of data.communities) {
		assert.ok(
			data.accounts.some((account) => account.number === community.owner),
		);
		assert.ok(
			[community.owner, ...community.members].includes(
				community.finalOwner,
			),
		);
		assert.equal(new Set(community.members).size, community.members.length);
		assert.ok(!community.members.includes(community.owner));
		for (const number of [community.owner, ...community.members])
			assert.ok(
				data.accounts.some((account) => account.number === number),
			);
		const organizers = data.accounts.filter((account) =>
			data
				.expectedMemberships(account.number)
				.some(
					(membership) =>
						membership.key === community.key &&
						membership.role === 'Organizer' &&
						membership.status === 'Active',
				),
		);
		assert.equal(organizers.length, 1);
	}
	assert.deepEqual(data.expectedMemberships(1), []);
	assert.deepEqual(data.expectedMemberships(5), []);
});

test('all content passes the current branch validators and uses authorized authors', () => {
	for (const community of data.communities)
		creationParser.parseCreateCommunityRequest({
			name: `${data.prefix} ${community.name}`,
			purpose: community.purpose,
			settings: {},
			operationId: community.key,
		});
	for (const post of data.posts) {
		const community = data.communities.find(
			(item) => item.key === post.community,
		);
		assert.ok(
			[community.owner, ...community.members].includes(post.author),
		);
		if (post.type === 'OrganizerAnnouncement')
			assert.equal(post.author, community.owner);
		postParser.parseCreateCommunityPostRequest({
			communityId: 'fixture',
			operationId: post.key,
			content: {
				postType: post.type,
				text: post.text,
				...(post.type === 'PrayerRequest'
					? { prayerRequestStatus: 'Current' }
					: {}),
			},
		});
		if (post.edit)
			postParser.parseEditCommunityPostRequest({
				communityId: 'fixture',
				postId: 'post',
				operationId: `edit-${post.key}`,
				expectedRevision: 0,
				text: post.edit,
			});
	}
	for (const reply of data.replies) {
		assert.ok(data.posts.some((post) => post.key === reply.post));
		postParser.parseCreateCommunityReplyRequest({
			communityId: 'fixture',
			postId: 'post',
			operationId: reply.key,
			text: reply.text,
		});
	}
	assert.equal(
		new Set(data.posts.map((post) => post.key)).size,
		data.posts.length,
	);
	assert.equal(
		new Set(data.replies.map((reply) => reply.key)).size,
		data.replies.length,
	);
	assert.ok(
		data.posts.find((post) => post.key === 'long-reading').text.length >
			9500,
	);
});

test('crosses real pagination boundaries while respecting default submission limits', () => {
	assert.ok(
		data.posts.filter((post) => post.community === 'circle').length >
			postParser.CommunityPostLimits.defaultPageSize,
	);
	assert.ok(
		data.replies.length > postParser.CommunityPostLimits.defaultPageSize,
	);
	const budgets = new Map();
	for (const item of [...data.posts, ...data.replies])
		budgets.set(
			item.author,
			(budgets.get(item.author) || 0) + 1 + (item.edit ? 1 : 0),
		);
	for (const [number, count] of budgets)
		assert.ok(
			count <= CommunitySafetyLimits.postAttemptsPerTenMinutes,
			`Account ${number} exceeds the backend submission limit`,
		);
});

test('production, unknown projects, and mixed endpoints fail closed', () => {
	const client = runtime.readClientConfiguration();
	const env = {
		GCLOUD_PROJECT: 'faithful-4325a',
		COMMUNITY_QA_ENVIRONMENT: 'non-production',
		COMMUNITY_QA_PASSWORD: 'synthetic-unit-value',
	};
	assert.equal(
		runtime.validateEnvironment(env, client).projectId,
		'faithful-4325a',
	);
	for (const patch of [
		{ NODE_ENV: 'production' },
		{ COMMUNITY_QA_ENVIRONMENT: 'production' },
		{ COMMUNITY_QA_ENVIRONMENT: '' },
		{ GCLOUD_PROJECT: 'another-project' },
		{ COMMUNITY_QA_PASSWORD: '' },
		{ FIRESTORE_EMULATOR_HOST: 'localhost:8080' },
		{ FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099' },
	])
		assert.throws(() =>
			runtime.validateEnvironment({ ...env, ...patch }, client),
		);
	assert.throws(() =>
		runtime.validateEnvironment(env, {
			...client,
			projectId: 'production-project',
		}),
	);
});

test('successful operations checkpoint only safe IDs and do not repeat writes', async () => {
	const state = { operations: {} };
	const execution = runtime.newExecution();
	let calls = 0;
	let saves = 0;
	const transport = {
		state,
		execution,
		save: () => saves++,
		run: (_number, _key, _endpoint, action) => action(),
		call: async (_number, _endpoint, request) => {
			calls++;
			assert.equal(request.operationId, runtime.operationId('sample'));
			return {
				postId: 'post-id',
				revision: 0,
				idToken: 'sensitive-token',
				invitation: { code: 'sensitive-code' },
			};
		},
	};
	await runtime.executeOnce(transport, 'sample', 3, 'createCommunityPost', {
		text: 'fixture',
	});
	await runtime.executeOnce(transport, 'sample', 3, 'createCommunityPost', {
		text: 'fixture',
	});
	assert.equal(calls, 1);
	assert.equal(saves, 1);
	assert.equal(execution.reusedOperations, 1);
	assert.deepEqual(state.operations.sample, {
		postId: 'post-id',
		revision: 0,
	});
});

test('ambiguous failures remain retryable with the same server operation ID and are recorded without sensitive payloads', async (t) => {
	t.mock.method(console, 'log', () => {});
	const state = { operations: {} };
	const execution = runtime.newExecution();
	const ids = [];
	let first = true;
	const transport = {
		state,
		execution,
		save: () => {},
		run: async (number, operation, endpoint, action) => {
			try {
				return await action();
			} catch (error) {
				runtime.recordFailure(
					execution,
					'recoverable',
					data.accounts[number - 1].email,
					operation,
					endpoint,
					error,
					'Retry required.',
				);
				return null;
			}
		},
		call: async (_number, _endpoint, request) => {
			ids.push(request.operationId);
			if (first) {
				first = false;
				throw {
					code: 'functions/unavailable',
					message: 'Bearer private-token',
					customData: { password: 'private-password' },
				};
			}
			return { postId: 'same-server-resource', revision: 0 };
		},
	};
	await runtime.executeOnce(
		transport,
		'uncertain',
		3,
		'createCommunityPost',
		{},
	);
	assert.equal(state.operations.uncertain, undefined);
	await runtime.executeOnce(
		transport,
		'uncertain',
		3,
		'createCommunityPost',
		{},
	);
	assert.equal(ids[0], ids[1]);
	assert.equal(execution.issues.length, 1);
	assert.equal(execution.issues[0].account, '77faithful_3@yopmail.com');
	assert.equal(JSON.stringify(execution).includes('private-token'), false);
	assert.equal(JSON.stringify(execution).includes('private-password'), false);
});

test('checkpoint survives reruns and rejects a different project or fixture definition', (t) => {
	const directory = fs.mkdtempSync(
		path.join(os.tmpdir(), 'community-qa-test-'),
	);
	t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
	const first = runtime.loadState(directory, 'faithful-4325a');
	first.state.operations.sample = { postId: 'stable-id' };
	first.save();
	assert.equal(
		runtime.loadState(directory, 'faithful-4325a').state.operations.sample
			.postId,
		'stable-id',
	);
	assert.throws(() => runtime.loadState(directory, 'different-project'));
	first.state.planDigest = 'changed';
	first.save();
	assert.throws(() => runtime.loadState(directory, 'faithful-4325a'));
});

test('reports distinguish blocked execution from planned resources and exclude credentials', () => {
	const execution = runtime.newExecution();
	execution.status = 'Blocked';
	const report = renderReport(execution);
	assert.ok(report.includes('0/10 accounts provisioned'));
	assert.ok(report.includes('0/5 communities verified'));
	for (const account of data.accounts)
		assert.ok(report.includes(`### ${account.email}`));
	const secret = 'synthetic-secret-with-symbols';
	const redacted = redact(
		`password=${secret} Bearer abcdef eyJabcdefgh.eyJijklmnop.abcdefghijk ${secret}`,
		[secret],
	);
	assert.equal(redacted.includes(secret), false);
	assert.equal(redacted.includes('abcdef '), false);
	assert.equal(redacted.includes('eyJ'), false);
});
