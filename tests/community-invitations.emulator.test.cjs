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
const {
	parseCommunityInvitationEncryptionConfiguration,
} = require('../functions/lib/src/community/community-invitation-crypto');
const invitations = require('../functions/lib/src/community/community-invitation');

const projectId = 'faithful-community-invitations-test';
const testNow = Timestamp.fromMillis(Date.UTC(2026, 8, 14, 12));
const encryptionConfiguration = parseCommunityInvitationEncryptionConfiguration(
	JSON.stringify({
		activeVersion: 'v1',
		keys: { v1: Buffer.alloc(32, 17).toString('base64') },
	}),
);
let database;

const dependencies = (now = testNow) => ({
	database,
	now,
	encryptionConfiguration,
});

const clearFirestore = async () => {
	const response = await fetch(
		`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
		{ method: 'DELETE' },
	);
	assert.equal(response.ok, true, await response.text());
};

const seedOrganizer = async ({
	communityId = 'alpha',
	userId = 'owner',
	activeInvitationId = null,
	includePointer = true,
	status = 'Active',
} = {}) => {
	await database.doc(`users/${userId}`).set({ preferredName: 'Organizer' });
	await database.doc(`communities/${communityId}`).set({
		schemaVersion: 1,
		name: 'Community',
		purpose: '',
		organizerUserId: userId,
		settings: {},
		lifecycle:
			status === 'Closed'
				? { status: 'Closed', closedAt: testNow }
				: { status: 'Active' },
		...(includePointer ? { activeInvitationId } : {}),
		revision: 0,
		createdAt: testNow,
		updatedAt: testNow,
	});
	await database.doc(`communities/${communityId}/members/${userId}`).set({
		schemaVersion: 1,
		communityId,
		userId,
		role: 'Organizer',
		joinedAt: testNow,
		lifecycle: { status: 'Active' },
		createdAt: testNow,
		updatedAt: testNow,
	});
};

const issue = (operationId = 'issue-1', communityId = 'alpha', now = testNow) =>
	invitations.issueCommunityInvitationForAccount(
		'owner',
		{ communityId, operationId },
		dependencies(now),
	);

const retrieve = (communityId = 'alpha', now = testNow) =>
	invitations.getCurrentCommunityInvitationForAccount(
		'owner',
		{ communityId },
		dependencies(now),
	);

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

test('issues encrypted reusable invitations and retrieves the same code without mutating or extending expiry', async () => {
	await seedOrganizer();
	const issued = await issue();
	assert.deepEqual(await issue(), issued);
	const invitationPath = `communities/alpha/invitations/${issued.invitation.invitationId}`;
	const beforeCommunity = (
		await database.doc('communities/alpha').get()
	).data();
	const beforeInvitation = (await database.doc(invitationPath).get()).data();
	const retrieved = await retrieve(
		'alpha',
		Timestamp.fromMillis(testNow.toMillis() + 1000),
	);
	const retrievedAgain = await retrieve(
		'alpha',
		Timestamp.fromMillis(testNow.toMillis() + 2000),
	);
	assert.deepEqual(retrieved, issued);
	assert.deepEqual(retrievedAgain, issued);
	assert.deepEqual(
		(await database.doc('communities/alpha').get()).data(),
		beforeCommunity,
	);
	assert.deepEqual(
		(await database.doc(invitationPath).get()).data(),
		beforeInvitation,
	);
	const serialized = JSON.stringify(beforeInvitation);
	assert.equal(serialized.includes(issued.invitation.code), false);
	assert.equal(
		serialized.includes(issued.invitation.code.replace(/-/g, '')),
		false,
	);
	assert.match(beforeInvitation.tokenDigest, /^[a-f0-9]{64}$/);
	assert.equal(beforeInvitation.encryptedCode.algorithm, 'Aes256Gcm');
	const receipt = (
		await database
			.doc('users/owner/communityInvitationIssueOperations/issue-1')
			.get()
	).data();
	assert.equal(
		JSON.stringify(receipt).includes(issued.invitation.code),
		false,
	);
	assert.equal(
		(
			await database
				.doc(
					`communityInvitationDigests/${beforeInvitation.tokenDigest}`,
				)
				.get()
		).exists,
		true,
	);
});

test('enforces the exact expiry boundary and requires a deliberate issue for a new 30-day code', async () => {
	await seedOrganizer();
	const first = await issue();
	const expiresAt = Timestamp.fromMillis(
		first.invitation.expiresAt.seconds * 1000 +
			first.invitation.expiresAt.nanoseconds / 1_000_000,
	);
	assert.deepEqual(
		await retrieve('alpha', Timestamp.fromMillis(expiresAt.toMillis() - 1)),
		first,
	);
	assert.deepEqual(await retrieve('alpha', expiresAt), { invitation: null });
	const afterRead = (await database.doc('communities/alpha').get()).data();
	assert.equal(afterRead.activeInvitationId, first.invitation.invitationId);
	const second = await issue('issue-2', 'alpha', expiresAt);
	assert.notEqual(
		second.invitation.invitationId,
		first.invitation.invitationId,
	);
	assert.notEqual(second.invitation.code, first.invitation.code);
	assert.equal(
		second.invitation.expiresAt.seconds,
		expiresAt.seconds + 30 * 24 * 60 * 60,
	);
	assert.equal(
		(
			await database
				.doc(
					`communities/alpha/invitations/${first.invitation.invitationId}`,
				)
				.get()
		).data().lifecycle.status,
		'Expired',
	);
});

test('rotates and revokes atomically while leaving existing membership untouched', async () => {
	await seedOrganizer();
	const first = await issue();
	const rotateRequest = { communityId: 'alpha', operationId: 'rotate-1' };
	const rotated = await invitations.rotateCommunityInvitationForAccount(
		'owner',
		rotateRequest,
		dependencies(),
	);
	assert.deepEqual(
		await invitations.rotateCommunityInvitationForAccount(
			'owner',
			rotateRequest,
			dependencies(),
		),
		rotated,
	);
	assert.notEqual(
		rotated.invitation.invitationId,
		first.invitation.invitationId,
	);
	assert.equal(
		(
			await database
				.doc(
					`communities/alpha/invitations/${first.invitation.invitationId}`,
				)
				.get()
		).data().lifecycle.status,
		'Revoked',
	);
	const revokeRequest = {
		communityId: 'alpha',
		invitationId: rotated.invitation.invitationId,
		operationId: 'revoke-1',
	};
	const revoked = await invitations.revokeCommunityInvitationForAccount(
		'owner',
		revokeRequest,
		{ database, now: testNow },
	);
	assert.deepEqual(
		await invitations.revokeCommunityInvitationForAccount(
			'owner',
			revokeRequest,
			{ database, now: testNow },
		),
		revoked,
	);
	assert.equal(revoked.invitationId, rotated.invitation.invitationId);
	assert.deepEqual(await retrieve(), { invitation: null });
	assert.equal(
		(await database.doc('communities/alpha').get()).data()
			.activeInvitationId,
		null,
	);
	assert.equal(
		(await database.doc('communities/alpha/members/owner').get()).data()
			.lifecycle.status,
		'Active',
	);
});

test('denies members, former organizers, closed communities, and replay after permission changes', async () => {
	await seedOrganizer();
	await database.doc('users/member').set({ preferredName: 'Member' });
	await database.doc('communities/alpha/members/member').set({
		communityId: 'alpha',
		userId: 'member',
		role: 'Member',
		lifecycle: { status: 'Active' },
	});
	await assert.rejects(
		invitations.issueCommunityInvitationForAccount(
			'member',
			{ communityId: 'alpha', operationId: 'member-issue' },
			dependencies(),
		),
		(error) =>
			error.code === 'permission-denied' &&
			error.details.reason === 'OrganizerRequired',
	);
	await issue('uncertain-issue');
	await database
		.doc('communities/alpha')
		.update({ organizerUserId: 'member' });
	await database
		.doc('communities/alpha/members/owner')
		.update({ role: 'Member' });
	await database
		.doc('communities/alpha/members/member')
		.update({ role: 'Organizer' });
	await assert.rejects(
		issue('uncertain-issue'),
		(error) => error.details.reason === 'OrganizerRequired',
	);
	await database.doc('communities/alpha').update({
		organizerUserId: 'owner',
		lifecycle: { status: 'Closed', closedAt: testNow },
	});
	await database
		.doc('communities/alpha/members/owner')
		.update({ role: 'Organizer' });
	await assert.rejects(
		issue('uncertain-issue'),
		(error) => error.details.reason === 'CommunityClosed',
	);
});

test('rejects retry payload changes and safely rejects legacy or tampered invitation data', async () => {
	await seedOrganizer();
	await seedOrganizer({ communityId: 'beta' });
	const issued = await issue('same-operation');
	await assert.rejects(
		issue('same-operation', 'beta'),
		(error) =>
			error.code === 'already-exists' &&
			error.details.reason === 'OperationPayloadMismatch',
	);
	const reference = database.doc(
		`communities/alpha/invitations/${issued.invitation.invitationId}`,
	);
	const encryptedCode = (await reference.get()).data().encryptedCode;
	await reference.update({
		encryptedCode: {
			...encryptedCode,
			ciphertext: Buffer.alloc(23, 1).toString('base64'),
		},
	});
	await assert.rejects(
		retrieve(),
		(error) =>
			error.code === 'internal' &&
			error.details.reason === 'InvitationDataUnavailable',
	);
	await clearFirestore();
	await seedOrganizer({ includePointer: false });
	await assert.rejects(
		retrieve(),
		(error) => error.details.reason === 'InvitationMigrationRequired',
	);
	await database
		.doc('communities/alpha')
		.update({ activeInvitationId: 'legacy' });
	await database.doc('communities/alpha/invitations/legacy').set({
		schemaVersion: 1,
		communityId: 'alpha',
		createdByUserId: 'owner',
		lifecycle: { status: 'Accepted', acceptedByUserId: 'member' },
	});
	await assert.rejects(
		retrieve(),
		(error) => error.details.reason === 'InvitationDataUnavailable',
	);
});

test('serializes concurrent issue, rotation, and revocation without two redeemable invitations', async () => {
	await seedOrganizer();
	const issued = await Promise.all([issue('issue-a'), issue('issue-b')]);
	assert.deepEqual(issued[0].invitation, issued[1].invitation);
	const rotations = await Promise.all([
		invitations.rotateCommunityInvitationForAccount(
			'owner',
			{ communityId: 'alpha', operationId: 'rotate-a' },
			dependencies(),
		),
		invitations.rotateCommunityInvitationForAccount(
			'owner',
			{ communityId: 'alpha', operationId: 'rotate-b' },
			dependencies(),
		),
	]);
	const current = await retrieve();
	assert.ok(
		rotations.some(
			(result) => result.invitation.code === current.invitation.code,
		),
	);
	const invitationSnapshots = await database
		.collection('communities/alpha/invitations')
		.get();
	assert.equal(
		invitationSnapshots.docs.filter(
			(snapshot) => snapshot.data().lifecycle.status === 'Active',
		).length,
		1,
	);
	const digestSnapshots = await database
		.collection('communityInvitationDigests')
		.get();
	assert.equal(digestSnapshots.size, 1);
	const activeId = current.invitation.invitationId;
	const concurrent = await Promise.allSettled([
		invitations.rotateCommunityInvitationForAccount(
			'owner',
			{ communityId: 'alpha', operationId: 'rotate-c' },
			dependencies(),
		),
		invitations.revokeCommunityInvitationForAccount(
			'owner',
			{
				communityId: 'alpha',
				invitationId: activeId,
				operationId: 'revoke-c',
			},
			{ database, now: testNow },
		),
	]);
	assert.ok(concurrent.some((result) => result.status === 'fulfilled'));
	const finalCommunity = (
		await database.doc('communities/alpha').get()
	).data();
	const finalInvitations = await database
		.collection('communities/alpha/invitations')
		.get();
	const active = finalInvitations.docs.filter(
		(snapshot) => snapshot.data().lifecycle.status === 'Active',
	);
	assert.ok(active.length <= 1);
	assert.equal(
		finalCommunity.activeInvitationId,
		active.length === 1 ? active[0].id : null,
	);
});
