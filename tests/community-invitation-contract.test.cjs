const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const {
	normalizeCommunityInvitationCode,
	parseGetCurrentCommunityInvitationRequest,
	parseIssueCommunityInvitationRequest,
	parseIssueCommunityInvitationResult,
	parseRevokeCommunityInvitationRequest,
	parseRevokeCommunityInvitationResult,
} = require('../functions/lib/generated/features/communities/community-invitation');
const {
	decryptCommunityInvitationCode,
	digestCommunityInvitationCode,
	encryptCommunityInvitationCode,
	generateCommunityInvitationCode,
	parseCommunityInvitationEncryptionConfiguration,
} = require('../functions/lib/src/community/community-invitation-crypto');
const {
	issueCommunityInvitation,
	getCurrentCommunityInvitation,
	getCurrentCommunityInvitationForAccount,
	issueCommunityInvitationForAccount,
	rotateCommunityInvitation,
	rotateCommunityInvitationForAccount,
	revokeCommunityInvitation,
	revokeCommunityInvitationForAccount,
} = require('../functions/lib/src/community/community-invitation');
const { Timestamp } = require(
	require.resolve('firebase-admin/firestore', {
		paths: [path.join(__dirname, '../functions')],
	}),
);

const serializedConfiguration = (byte = 7) =>
	JSON.stringify({
		activeVersion: 'v1',
		keys: { v1: Buffer.alloc(32, byte).toString('base64') },
	});

const databaseFixture = () => {
	const now = Timestamp.fromMillis(Date.UTC(2026, 8, 14, 12));
	const documents = new Map([
		['users/owner', { preferredName: 'Organizer' }],
		[
			'communities/alpha',
			{
				organizerUserId: 'owner',
				lifecycle: { status: 'Active' },
				activeInvitationId: null,
				revision: 0,
				createdAt: now,
				updatedAt: now,
			},
		],
		[
			'communities/alpha/members/owner',
			{
				communityId: 'alpha',
				userId: 'owner',
				role: 'Organizer',
				lifecycle: { status: 'Active' },
			},
		],
	]);
	let nextId = 0;
	class Reference {
		constructor(path) {
			this.path = path;
			this.id = path.split('/').at(-1);
		}
		collection(name) {
			return new Reference(`${this.path}/${name}`);
		}
		doc(id = `invitation-${++nextId}`) {
			return new Reference(`${this.path}/${id}`);
		}
	}
	const database = {
		doc: (path) => new Reference(path),
		collection: (path) => new Reference(path),
		runTransaction: async (callback) => {
			const writes = [];
			const result = await callback({
				get: async (reference) => ({
					exists: documents.has(reference.path),
					data: () => documents.get(reference.path),
				}),
				create: (reference, value) =>
					writes.push(['create', reference.path, value]),
				update: (reference, value) =>
					writes.push(['update', reference.path, value]),
				delete: (reference) => writes.push(['delete', reference.path]),
			});
			for (const [kind, path, value] of writes) {
				if (kind === 'create') {
					assert.equal(documents.has(path), false, path);
					documents.set(path, value);
				} else if (kind === 'update') {
					assert.equal(documents.has(path), true, path);
					documents.set(path, { ...documents.get(path), ...value });
				} else {
					documents.delete(path);
				}
			}
			return result;
		},
	};
	return { database, documents, now };
};

test('normalizes only case and approved separators for a bounded unambiguous code', () => {
	const code = generateCommunityInvitationCode();
	assert.match(
		code,
		/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}(?:-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}){3}$/,
	);
	assert.equal(
		normalizeCommunityInvitationCode(code.toLowerCase()),
		code.replace(/-/g, ''),
	);
	for (const invalid of [
		code + '-',
		code.replace('-', ' '),
		code.replace('-', '_'),
		'0' + code.slice(1),
		'I' + code.slice(1),
		code.replace('-', '--'),
		'a'.repeat(1000),
	])
		assert.throws(() => normalizeCommunityInvitationCode(invalid));
	const generated = new Set(
		Array.from({ length: 200 }, generateCommunityInvitationCode),
	);
	assert.equal(generated.size, 200);
});

test('encrypts with fresh authenticated nonces and detects ciphertext, tag, and context tampering', () => {
	const configuration = parseCommunityInvitationEncryptionConfiguration(
		serializedConfiguration(),
	);
	const code = '23456-789AB-CDEFG-HJKMN';
	const first = encryptCommunityInvitationCode(
		code,
		'community-1',
		'invitation-1',
		configuration,
	);
	const second = encryptCommunityInvitationCode(
		code,
		'community-1',
		'invitation-1',
		configuration,
	);
	assert.notEqual(first.nonce, second.nonce);
	assert.notEqual(first.ciphertext, code);
	assert.equal(
		decryptCommunityInvitationCode(
			first,
			'community-1',
			'invitation-1',
			configuration,
		),
		code,
	);
	for (const [encrypted, communityId, invitationId] of [
		[
			{ ...first, ciphertext: second.ciphertext },
			'community-1',
			'invitation-1',
		],
		[
			{ ...first, authenticationTag: second.authenticationTag },
			'community-1',
			'invitation-1',
		],
		[first, 'community-2', 'invitation-1'],
		[first, 'community-1', 'invitation-2'],
	])
		assert.throws(
			() =>
				decryptCommunityInvitationCode(
					encrypted,
					communityId,
					invitationId,
					configuration,
				),
			{ code: 'internal' },
		);
	assert.match(
		digestCommunityInvitationCode(code.replace(/-/g, '')),
		/^[a-f0-9]{64}$/,
	);
});

test('fails closed for missing, malformed, unknown-version, and non-256-bit key configuration', () => {
	for (const serialized of [
		'',
		'{}',
		JSON.stringify({ activeVersion: 'v1', keys: {} }),
		JSON.stringify({
			activeVersion: 'v2',
			keys: { v1: Buffer.alloc(32).toString('base64') },
		}),
		JSON.stringify({
			activeVersion: 'v1',
			keys: { v1: Buffer.alloc(31).toString('base64') },
		}),
		JSON.stringify({ activeVersion: 'v1', keys: { v1: 'not base64' } }),
		JSON.stringify({
			activeVersion: 'v1',
			keys: { v1: Buffer.alloc(32).toString('base64') },
			extra: true,
		}),
	])
		assert.throws(
			() => parseCommunityInvitationEncryptionConfiguration(serialized),
			{ code: 'failed-precondition' },
		);
});

test('executes issue, stable read, rotation, retry, and revocation without plaintext persistence', async () => {
	const { database, documents, now } = databaseFixture();
	const encryptionConfiguration =
		parseCommunityInvitationEncryptionConfiguration(
			serializedConfiguration(),
		);
	const dependencies = { database, now, encryptionConfiguration };
	const issueRequest = { communityId: 'alpha', operationId: 'issue-1' };
	const issued = await issueCommunityInvitationForAccount(
		'owner',
		issueRequest,
		dependencies,
	);
	assert.deepEqual(parseIssueCommunityInvitationResult(issued), issued);
	assert.deepEqual(Object.keys(issued.invitation.expiresAt), [
		'seconds',
		'nanoseconds',
	]);
	assert.deepEqual(
		await issueCommunityInvitationForAccount(
			'owner',
			issueRequest,
			dependencies,
		),
		issued,
	);
	assert.deepEqual(
		await getCurrentCommunityInvitationForAccount(
			'owner',
			{ communityId: 'alpha' },
			dependencies,
		),
		issued,
	);
	const persisted = documents.get(
		`communities/alpha/invitations/${issued.invitation.invitationId}`,
	);
	assert.equal(
		JSON.stringify(persisted).includes(issued.invitation.code),
		false,
	);
	const expiryNow = Timestamp.fromMillis(
		issued.invitation.expiresAt.seconds * 1000 +
			issued.invitation.expiresAt.nanoseconds / 1_000_000,
	);
	const communityBeforeExpiryRead = documents.get('communities/alpha');
	assert.deepEqual(
		await getCurrentCommunityInvitationForAccount(
			'owner',
			{ communityId: 'alpha' },
			{ ...dependencies, now: expiryNow },
		),
		{ invitation: null },
	);
	assert.equal(documents.get('communities/alpha'), communityBeforeExpiryRead);
	const renewed = await issueCommunityInvitationForAccount(
		'owner',
		{ communityId: 'alpha', operationId: 'issue-2' },
		{ ...dependencies, now: expiryNow },
	);
	assert.notEqual(
		renewed.invitation.invitationId,
		issued.invitation.invitationId,
	);
	assert.equal(
		documents.get(
			`communities/alpha/invitations/${issued.invitation.invitationId}`,
		).lifecycle.status,
		'Expired',
	);
	const rotateRequest = { communityId: 'alpha', operationId: 'rotate-1' };
	const rotated = await rotateCommunityInvitationForAccount(
		'owner',
		rotateRequest,
		{ ...dependencies, now: expiryNow },
	);
	assert.deepEqual(
		await rotateCommunityInvitationForAccount('owner', rotateRequest, {
			...dependencies,
			now: expiryNow,
		}),
		rotated,
	);
	const revokeRequest = {
		communityId: 'alpha',
		invitationId: rotated.invitation.invitationId,
		operationId: 'revoke-1',
	};
	const revoked = await revokeCommunityInvitationForAccount(
		'owner',
		revokeRequest,
		{ database, now: expiryNow },
	);
	assert.deepEqual(parseRevokeCommunityInvitationResult(revoked), revoked);
	assert.deepEqual(Object.keys(revoked.revokedAt), [
		'seconds',
		'nanoseconds',
	]);
	assert.deepEqual(
		await revokeCommunityInvitationForAccount('owner', revokeRequest, {
			database,
			now: expiryNow,
		}),
		revoked,
	);
	assert.deepEqual(
		await getCurrentCommunityInvitationForAccount(
			'owner',
			{ communityId: 'alpha' },
			dependencies,
		),
		{ invitation: null },
	);
});

test('rechecks organizer and lifecycle on replay and fails safely for legacy or tampered records', async () => {
	const { database, documents, now } = databaseFixture();
	const encryptionConfiguration =
		parseCommunityInvitationEncryptionConfiguration(
			serializedConfiguration(),
		);
	const dependencies = { database, now, encryptionConfiguration };
	const request = { communityId: 'alpha', operationId: 'issue-1' };
	const issued = await issueCommunityInvitationForAccount(
		'owner',
		request,
		dependencies,
	);
	const invitationPath = `communities/alpha/invitations/${issued.invitation.invitationId}`;
	const invitation = documents.get(invitationPath);
	documents.set(invitationPath, {
		...invitation,
		encryptedCode: {
			...invitation.encryptedCode,
			ciphertext: Buffer.alloc(23, 1).toString('base64'),
		},
	});
	await assert.rejects(
		getCurrentCommunityInvitationForAccount(
			'owner',
			{ communityId: 'alpha' },
			dependencies,
		),
		(error) => error.details.reason === 'InvitationDataUnavailable',
	);
	documents.set(invitationPath, invitation);
	documents.set('users/member', { preferredName: 'Member' });
	documents.set('communities/alpha/members/member', {
		communityId: 'alpha',
		userId: 'member',
		role: 'Member',
		lifecycle: { status: 'Active' },
	});
	await assert.rejects(
		getCurrentCommunityInvitationForAccount(
			'member',
			{ communityId: 'alpha' },
			dependencies,
		),
		(error) => error.details.reason === 'OrganizerRequired',
	);
	documents.set('communities/alpha', {
		...documents.get('communities/alpha'),
		organizerUserId: 'member',
	});
	documents.set('communities/alpha/members/owner', {
		...documents.get('communities/alpha/members/owner'),
		role: 'Member',
	});
	await assert.rejects(
		issueCommunityInvitationForAccount('owner', request, dependencies),
		(error) => error.details.reason === 'OrganizerRequired',
	);
	documents.set('communities/alpha', {
		...documents.get('communities/alpha'),
		organizerUserId: 'owner',
		lifecycle: { status: 'Closed', closedAt: now },
	});
	documents.set('communities/alpha/members/owner', {
		...documents.get('communities/alpha/members/owner'),
		role: 'Organizer',
	});
	await assert.rejects(
		issueCommunityInvitationForAccount('owner', request, dependencies),
		(error) => error.details.reason === 'CommunityClosed',
	);
	const legacy = databaseFixture();
	const legacyCommunity = legacy.documents.get('communities/alpha');
	delete legacyCommunity.activeInvitationId;
	await assert.rejects(
		getCurrentCommunityInvitationForAccount(
			'owner',
			{ communityId: 'alpha' },
			{
				database: legacy.database,
				now: legacy.now,
				encryptionConfiguration,
			},
		),
		(error) => error.details.reason === 'InvitationMigrationRequired',
	);
});

test('request and result parsers reject unexpected, forged, oversized, and malformed fields', () => {
	assert.deepEqual(
		parseIssueCommunityInvitationRequest({
			communityId: 'community-1',
			operationId: 'operation-1',
		}),
		{ communityId: 'community-1', operationId: 'operation-1' },
	);
	assert.deepEqual(
		parseGetCurrentCommunityInvitationRequest({
			communityId: 'community-1',
		}),
		{ communityId: 'community-1' },
	);
	assert.deepEqual(
		parseRevokeCommunityInvitationRequest({
			communityId: 'community-1',
			invitationId: 'invitation-1',
			operationId: 'operation-1',
		}),
		{
			communityId: 'community-1',
			invitationId: 'invitation-1',
			operationId: 'operation-1',
		},
	);
	for (const invalid of [
		null,
		{},
		{ communityId: '../other', operationId: 'operation-1' },
		{ communityId: 'community-1', operationId: '../other' },
		{
			communityId: 'community-1',
			operationId: 'operation-1',
			userId: 'forged',
		},
		{ communityId: 'x'.repeat(129), operationId: 'operation-1' },
	])
		assert.throws(() => parseIssueCommunityInvitationRequest(invalid));
	assert.throws(() =>
		parseIssueCommunityInvitationResult({
			invitation: {
				communityId: 'community-1',
				invitationId: 'invitation-1',
				code: '23456-789AB-CDEFG-HJKMN',
				expiresAt: { seconds: 1, nanoseconds: 0 },
				tokenDigest: 'private',
			},
		}),
	);
});

test('callables reject missing or unverified authentication before secret access', async () => {
	for (const callable of [
		issueCommunityInvitation,
		getCurrentCommunityInvitation,
		rotateCommunityInvitation,
		revokeCommunityInvitation,
	]) {
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
});

test('binds the encryption secret only to callables that encrypt or decrypt codes', () => {
	for (const callable of [
		issueCommunityInvitation,
		getCurrentCommunityInvitation,
		rotateCommunityInvitation,
	])
		assert.deepEqual(callable.__endpoint.secretEnvironmentVariables, [
			{ key: 'COMMUNITY_INVITATION_ENCRYPTION_KEYS' },
		]);
	assert.equal(
		revokeCommunityInvitation.__endpoint.secretEnvironmentVariables,
		undefined,
	);
});

test('invitation implementation contains no plaintext logging path', () => {
	const source = [
		'functions/src/community/community-invitation.ts',
		'functions/src/community/community-invitation-crypto.ts',
	]
		.map((path) => readFileSync(path, 'utf8'))
		.join('\n');
	assert.doesNotMatch(source, /console\.|logger\.|functions\.logger/);
});
