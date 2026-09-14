const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const {
	parseAcceptCommunityInvitationRequest,
	parseAcceptCommunityInvitationResult,
	parsePreviewCommunityInvitationRequest,
	parsePreviewCommunityInvitationResult,
} = require('../functions/lib/generated/features/communities/community-invitation');
const {
	parseCommunityInvitationEncryptionConfiguration,
} = require('../functions/lib/src/community/community-invitation-crypto');
const {
	issueCommunityInvitationForAccount,
} = require('../functions/lib/src/community/community-invitation');
const {
	acceptCommunityInvitation,
	acceptCommunityInvitationForAccount,
	previewCommunityInvitation,
	previewCommunityInvitationForAccount,
} = require('../functions/lib/src/community/community-invitation-redemption');
const { Timestamp } = require(
	require.resolve('firebase-admin/firestore', {
		paths: [path.join(__dirname, '../functions')],
	}),
);

const testNow = Timestamp.fromMillis(Date.UTC(2026, 8, 14, 12));
const encryptionConfiguration = parseCommunityInvitationEncryptionConfiguration(
	JSON.stringify({
		activeVersion: 'v1',
		keys: { v1: Buffer.alloc(32, 29).toString('base64') },
	}),
);

const profile = (preferredName) => ({
	schemaVersion: 1,
	revision: 0,
	preferredName,
	createdAt: testNow,
	updatedAt: testNow,
});

const membership = (userId, lifecycle = { status: 'Active' }) => ({
	schemaVersion: 1,
	communityId: 'alpha',
	userId,
	role: userId === 'owner' ? 'Organizer' : 'Member',
	joinedAt: testNow,
	lifecycle,
	createdAt: testNow,
	updatedAt: testNow,
});

const databaseFixture = ({ retryTransactions = false } = {}) => {
	const documents = new Map([
		['users/owner', profile('Organizer')],
		['users/member-a', profile(null)],
		['users/member-b', profile('Member B')],
		['users/no-journey', profile(null)],
		[
			'communities/alpha',
			{
				schemaVersion: 1,
				name: 'Grace Fellowship',
				purpose: 'Encourage one another in Christ.',
				organizerUserId: 'owner',
				settings: { participationExpectations: 'Be gracious.' },
				lifecycle: { status: 'Active' },
				activeInvitationId: null,
				revision: 0,
				createdAt: testNow,
				updatedAt: testNow,
			},
		],
		['communities/alpha/members/owner', membership('owner')],
		['users/owner/communityMemberships/alpha', membership('owner')],
	]);
	let nextId = 0;
	class Reference {
		constructor(documentPath) {
			this.path = documentPath;
			this.id = documentPath.split('/').at(-1);
		}
		collection(name) {
			return new Reference(`${this.path}/${name}`);
		}
		doc(id = `invitation-${++nextId}`) {
			return new Reference(`${this.path}/${id}`);
		}
	}
	const snapshot = (reference) => ({
		id: reference.id,
		exists: documents.has(reference.path),
		data: () => documents.get(reference.path),
	});
	const run = async (callback, applyWrites) => {
		const writes = [];
		const result = await callback({
			get: async (reference) => snapshot(reference),
			create: (reference, value) =>
				writes.push(['create', reference.path, value]),
			set: (reference, value) =>
				writes.push(['set', reference.path, value]),
			update: (reference, value) =>
				writes.push(['update', reference.path, value]),
			delete: (reference) => writes.push(['delete', reference.path]),
		});
		if (applyWrites) {
			for (const [kind, documentPath, value] of writes) {
				if (kind === 'create') {
					assert.equal(
						documents.has(documentPath),
						false,
						documentPath,
					);
					documents.set(documentPath, value);
				} else if (kind === 'set') documents.set(documentPath, value);
				else if (kind === 'update') {
					assert.equal(
						documents.has(documentPath),
						true,
						documentPath,
					);
					documents.set(documentPath, {
						...documents.get(documentPath),
						...value,
					});
				} else documents.delete(documentPath);
			}
		}
		return result;
	};
	const database = {
		doc: (documentPath) => new Reference(documentPath),
		collection: (documentPath) => new Reference(documentPath),
		runTransaction: async (callback) => {
			if (retryTransactions) await run(callback, false);
			return run(callback, true);
		},
	};
	return { database, documents };
};

const dependencies = (database, attemptLimits) => ({
	database,
	now: testNow,
	requestScopeDigest: 'a'.repeat(64),
	...(attemptLimits ? { attemptLimits } : {}),
});

const issue = async (database) =>
	issueCommunityInvitationForAccount(
		'owner',
		{ communityId: 'alpha', operationId: 'issue-one' },
		{ database, now: testNow, encryptionConfiguration },
	);

test('parses bounded preview and acceptance contracts without caller-owned authority fields', () => {
	assert.deepEqual(
		parsePreviewCommunityInvitationRequest({
			invitationCode: '23456-789ab-cdefg-hjkmn',
		}),
		{ invitationCode: '23456789ABCDEFGHJKMN' },
	);
	assert.deepEqual(
		parseAcceptCommunityInvitationRequest({
			invitationCode: '23456-789AB-CDEFG-HJKMN',
			displayName: '  Reader  ',
			operationId: 'accept-one',
		}),
		{
			invitationCode: '23456789ABCDEFGHJKMN',
			displayName: 'Reader',
			operationId: 'accept-one',
		},
	);
	for (const input of [
		{ invitationCode: 'x'.repeat(1000) },
		{ invitationCode: '23456-789AB-CDEFG-HJKMN', role: 'Organizer' },
		{
			invitationCode: '23456-789AB-CDEFG-HJKMN',
			displayName: 'Reader',
			operationId: 'accept-one',
			userId: 'forged',
		},
		{
			invitationCode: '23456-789AB-CDEFG-HJKMN',
			displayName: 'Reader',
			operationId: 'accept-one',
			role: 'Organizer',
			createdAt: { seconds: 1, nanoseconds: 0 },
			joinedAt: { seconds: 1, nanoseconds: 0 },
		},
	]) {
		const parser =
			'displayName' in input
				? parseAcceptCommunityInvitationRequest
				: parsePreviewCommunityInvitationRequest;
		assert.throws(() => parser(input));
	}
});

test('previews only approved invitation fields and no member, post, contact, or secret data', async () => {
	const { database } = databaseFixture();
	const issued = await issue(database);
	const result = await previewCommunityInvitationForAccount(
		'member-a',
		{ invitationCode: issued.invitation.code },
		dependencies(database),
	);
	assert.deepEqual(result, {
		preview: {
			communityName: 'Grace Fellowship',
			communityPurpose: 'Encourage one another in Christ.',
			organizerDisplayName: 'Organizer',
			participationExpectations: 'Be gracious.',
			expiresAt: issued.invitation.expiresAt,
		},
	});
	assert.deepEqual(
		parsePreviewCommunityInvitationResult({
			preview: {
				...result.preview,
				expiresAt: {
					seconds: result.preview.expiresAt.seconds,
					nanoseconds: result.preview.expiresAt.nanoseconds,
				},
			},
		}),
		{
			preview: {
				...result.preview,
				expiresAt: {
					seconds: result.preview.expiresAt.seconds,
					nanoseconds: result.preview.expiresAt.nanoseconds,
				},
			},
		},
	);
	assert.doesNotMatch(
		JSON.stringify(result),
		/member|post|email|digest|code|invitationId|communityId/i,
	);
});

test('two accounts redeem one reusable code and retries do not duplicate membership, redemption, or index records', async () => {
	const { database, documents } = databaseFixture({
		retryTransactions: true,
	});
	const issued = await issue(database);
	const firstRequest = {
		invitationCode: issued.invitation.code,
		displayName: 'Member A',
		operationId: 'accept-a',
	};
	const first = await acceptCommunityInvitationForAccount(
		'member-a',
		firstRequest,
		dependencies(database),
	);
	assert.equal(first.outcome, 'Accepted');
	assert.deepEqual(
		await acceptCommunityInvitationForAccount(
			'member-a',
			firstRequest,
			dependencies(database),
		),
		first,
	);
	const second = await acceptCommunityInvitationForAccount(
		'member-b',
		{
			invitationCode: issued.invitation.code,
			displayName: 'Member B',
			operationId: 'accept-b',
		},
		{
			...dependencies(database),
			requestScopeDigest: 'b'.repeat(64),
		},
	);
	assert.equal(second.outcome, 'Accepted');
	assert.equal(
		documents.get('communities/alpha/members/member-a').lifecycle.status,
		'Active',
	);
	assert.equal(documents.get('users/member-a').preferredName, 'Member A');
	assert.deepEqual(
		documents.get('users/member-a/communityMemberships/alpha'),
		documents.get('communities/alpha/members/member-a'),
	);
	assert.equal(
		[...documents.keys()].filter((key) =>
			key.includes('/redemptions/member-a'),
		).length,
		1,
	);
	assert.equal(
		[...documents.keys()].filter((key) =>
			key.includes('/redemptions/member-b'),
		).length,
		1,
	);
	assert.equal(documents.has('users/member-a/journeys/current'), false);
	assert.equal(documents.has('users/member-b/journeys/current'), false);
	assert.equal(
		JSON.stringify([...documents.entries()]).includes(
			issued.invitation.code,
		),
		false,
	);
	assert.deepEqual(parseAcceptCommunityInvitationResult(first), first);
});

test('returns already-member, permits Left rejoin, denies Removed and Leaving, and accepts an account without a journey', async () => {
	const { database, documents } = databaseFixture();
	const issued = await issue(database);
	const ownerResult = await acceptCommunityInvitationForAccount(
		'owner',
		{
			invitationCode: issued.invitation.code,
			displayName: 'Organizer',
			operationId: 'owner-accept',
		},
		dependencies(database),
	);
	assert.equal(ownerResult.outcome, 'AlreadyMember');
	assert.equal(ownerResult.membership.role, 'Organizer');

	documents.set(
		'communities/alpha/members/member-a',
		membership('member-a', { status: 'Left', leftAt: testNow }),
	);
	documents.set(
		'users/member-a/communityMemberships/alpha',
		membership('member-a', { status: 'Left', leftAt: testNow }),
	);
	const rejoined = await acceptCommunityInvitationForAccount(
		'member-a',
		{
			invitationCode: issued.invitation.code,
			displayName: 'Member A',
			operationId: 'rejoin-a',
		},
		dependencies(database),
	);
	assert.equal(rejoined.outcome, 'Rejoined');

	for (const [index, [userId, lifecycle, reason]] of [
		[
			'member-b',
			{ status: 'Removed', removedAt: testNow },
			'MembershipRemoved',
		],
		[
			'no-journey',
			{ status: 'Leaving', leaveRequestedAt: testNow },
			'MembershipUnavailable',
		],
	].entries()) {
		documents.set(
			`communities/alpha/members/${userId}`,
			membership(userId, lifecycle),
		);
		await assert.rejects(
			acceptCommunityInvitationForAccount(
				userId,
				{
					invitationCode: issued.invitation.code,
					displayName: userId,
					operationId: `accept-${userId}`,
				},
				{
					...dependencies(database),
					requestScopeDigest: (index === 0 ? 'b' : 'c').repeat(64),
				},
			),
			(error) => error.details.reason === reason,
		);
	}
	documents.delete('communities/alpha/members/no-journey');
	const noJourney = await acceptCommunityInvitationForAccount(
		'no-journey',
		{
			invitationCode: issued.invitation.code,
			displayName: 'No Journey',
			operationId: 'no-journey-accept',
		},
		{
			...dependencies(database),
			requestScopeDigest: 'd'.repeat(64),
		},
	);
	assert.equal(noJourney.outcome, 'Accepted');
	assert.equal(documents.has('users/no-journey/journeys/current'), false);
});

test('rejects invalid, expired, revoked, rotated, and closed invitations with a stable unavailable reason', async () => {
	for (const kind of ['invalid', 'expired', 'revoked', 'rotated', 'closed']) {
		const { database, documents } = databaseFixture();
		const issued = await issue(database);
		const invitationPath = `communities/alpha/invitations/${issued.invitation.invitationId}`;
		const digest = documents.get(invitationPath).tokenDigest;
		if (kind === 'invalid')
			documents.delete(`communityInvitationDigests/${digest}`);
		if (kind === 'revoked')
			documents.set(invitationPath, {
				...documents.get(invitationPath),
				lifecycle: { status: 'Revoked', revokedAt: testNow },
			});
		if (kind === 'rotated')
			documents.set('communities/alpha', {
				...documents.get('communities/alpha'),
				activeInvitationId: 'another-invitation',
			});
		if (kind === 'closed')
			documents.set('communities/alpha', {
				...documents.get('communities/alpha'),
				lifecycle: { status: 'Closed', closedAt: testNow },
			});
		const attemptDependencies =
			kind === 'expired'
				? {
						...dependencies(database),
						now: Timestamp.fromMillis(
							testNow.toMillis() + 31 * 24 * 60 * 60 * 1000,
						),
					}
				: dependencies(database);
		await assert.rejects(
			previewCommunityInvitationForAccount(
				'member-a',
				{ invitationCode: issued.invitation.code },
				attemptDependencies,
			),
			(error) => error.details.reason === 'InvitationUnavailable',
		);
	}
});

test('rate limits actor and request scope before parsing and detects operation payload mismatch', async () => {
	const { database } = databaseFixture();
	const issued = await issue(database);
	const limited = dependencies(database, {
		preview: { account: 1, requestScope: 1 },
		accept: { account: 2, requestScope: 2 },
	});
	await assert.rejects(
		previewCommunityInvitationForAccount(
			'member-a',
			{ invitationCode: 'x'.repeat(1000) },
			limited,
		),
		(error) => error.details.reason === 'InvalidInput',
	);
	await assert.rejects(
		previewCommunityInvitationForAccount(
			'member-a',
			{ invitationCode: issued.invitation.code },
			limited,
		),
		(error) => error.details.reason === 'RateLimited',
	);
	const request = {
		invitationCode: issued.invitation.code,
		displayName: 'Member A',
		operationId: 'same-operation',
	};
	await acceptCommunityInvitationForAccount('member-a', request, limited);
	await assert.rejects(
		acceptCommunityInvitationForAccount(
			'member-a',
			{ ...request, displayName: 'Changed' },
			limited,
		),
		(error) => error.details.reason === 'OperationPayloadMismatch',
	);
});

test('callables deny anonymous and unverified accounts before resolving invitation data', async () => {
	for (const callable of [
		previewCommunityInvitation,
		acceptCommunityInvitation,
	]) {
		await assert.rejects(callable.run({ data: {} }), {
			code: 'unauthenticated',
		});
		await assert.rejects(
			callable.run({
				data: {},
				auth: { uid: 'outsider', token: { email_verified: false } },
			}),
			{ code: 'permission-denied' },
		);
	}
});

test('redemption implementation has no request, code, or body logging path', () => {
	const source = readFileSync(
		'functions/src/community/community-invitation-redemption.ts',
		'utf8',
	);
	assert.doesNotMatch(source, /console\.|logger\.|functions\.logger/);
});
