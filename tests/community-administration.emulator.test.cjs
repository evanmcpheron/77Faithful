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
const administration = require('../functions/lib/src/community/community-administration');
const invitations = require('../functions/lib/src/community/community-invitation');
const redemptions = require('../functions/lib/src/community/community-invitation-redemption');
const readers = require('../functions/lib/src/community/read-community-context');

const projectId = 'faithful-community-administration-test';
const testNow = Timestamp.fromMillis(Date.UTC(2026, 8, 14, 15));
const nextNow = Timestamp.fromMillis(testNow.toMillis() + 1000);
const encryptionConfiguration = parseCommunityInvitationEncryptionConfiguration(
	JSON.stringify({
		activeVersion: 'v1',
		keys: { v1: Buffer.alloc(32, 41).toString('base64') },
	}),
);
let database;

const dependencies = (now = testNow) => ({ database, now });
const invitationDependencies = (now = testNow) => ({
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

const membership = (communityId, userId, role = 'Member') => ({
	schemaVersion: 1,
	communityId,
	userId,
	role,
	joinedAt: testNow,
	lifecycle: { status: 'Active' },
	createdAt: testNow,
	updatedAt: testNow,
});

const seedAccount = async (userId, preferredName) => {
	await database.doc(`users/${userId}`).set({
		schemaVersion: 1,
		revision: 0,
		preferredName,
		createdAt: testNow,
		updatedAt: testNow,
	});
};

const seedMembership = async (communityId, userId, role = 'Member') => {
	const value = membership(communityId, userId, role);
	await Promise.all([
		database.doc(`communities/${communityId}/members/${userId}`).set(value),
		database
			.doc(`users/${userId}/communityMemberships/${communityId}`)
			.set(value),
	]);
};

const seedCommunity = async (communityId = 'alpha') => {
	await Promise.all([
		seedAccount('owner', 'Organizer'),
		seedAccount('member-a', 'Member A'),
		seedAccount('member-b', 'Member B'),
	]);
	await database.doc(`communities/${communityId}`).set({
		schemaVersion: 1,
		name: 'Community',
		purpose: 'Original purpose.',
		organizerUserId: 'owner',
		settings: {},
		lifecycle: { status: 'Active' },
		activeInvitationId: null,
		revision: 0,
		createdAt: testNow,
		updatedAt: testNow,
	});
	await Promise.all([
		seedMembership(communityId, 'owner', 'Organizer'),
		seedMembership(communityId, 'member-a'),
		seedMembership(communityId, 'member-b'),
	]);
};

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

test('updates settings with revision/idempotency checks and denies member administration or forged fields', async () => {
	await seedCommunity();
	const request = {
		communityId: 'alpha',
		name: 'Grace Fellowship',
		purpose: 'Encourage one another in Christ.',
		settings: { participationExpectations: 'Be gracious.' },
		expectedRevision: 0,
		operationId: 'update-1',
	};
	const first = await administration.updateCommunityForAccount(
		'owner',
		request,
		dependencies(),
	);
	assert.deepEqual(
		await administration.updateCommunityForAccount(
			'owner',
			request,
			dependencies(nextNow),
		),
		first,
	);
	assert.equal(first.community.name, 'Grace Fellowship');
	assert.equal(
		(await database.doc('communities/alpha').get()).data().revision,
		1,
	);
	await assert.rejects(
		administration.updateCommunityForAccount(
			'member-a',
			{ ...request, operationId: 'member-update', expectedRevision: 1 },
			dependencies(),
		),
		(error) => error.details.reason === 'OrganizerRequired',
	);
	await assert.rejects(
		administration.updateCommunityForAccount(
			'owner',
			{ ...request, purpose: 'Changed payload.' },
			dependencies(),
		),
		(error) => error.details.reason === 'OperationPayloadMismatch',
	);
	await assert.rejects(
		administration.updateCommunityForAccount(
			'owner',
			{ ...request, operationId: 'stale', expectedRevision: 0 },
			dependencies(),
		),
		(error) => error.details.reason === 'RevisionConflict',
	);
});

test('leave and removal atomically revoke both membership indexes without changing private journeys', async () => {
	await seedCommunity();
	const privateJourney = {
		userId: 'member-a',
		state: { status: 'Active' },
		privateWriting: 'Never community data.',
		practiceIds: ['Prayer'],
	};
	await database.doc('users/member-a/journeys/private').set(privateJourney);
	const leaveRequest = { communityId: 'alpha', operationId: 'leave-1' };
	const left = await administration.leaveCommunityForAccount(
		'member-a',
		leaveRequest,
		dependencies(),
	);
	assert.deepEqual(
		await administration.leaveCommunityForAccount(
			'member-a',
			leaveRequest,
			dependencies(nextNow),
		),
		left,
	);
	for (const path of [
		'communities/alpha/members/member-a',
		'users/member-a/communityMemberships/alpha',
	])
		assert.equal(
			(await database.doc(path).get()).data().lifecycle.status,
			'Left',
		);
	await assert.rejects(
		readers.getCommunityContextForAccount(
			'member-a',
			{ communityId: 'alpha' },
			database,
		),
		(error) => error.details.reason === 'CommunityUnavailable',
	);
	await assert.rejects(
		administration.leaveCommunityForAccount(
			'owner',
			{ communityId: 'alpha', operationId: 'owner-leave' },
			dependencies(),
		),
		(error) => error.details.reason === 'OrganizerTransferRequired',
	);

	const removed = await administration.removeCommunityMemberForAccount(
		'owner',
		{
			communityId: 'alpha',
			memberUserId: 'member-b',
			privateReason: 'Private safety context.',
			operationId: 'remove-1',
		},
		dependencies(),
	);
	assert.equal(removed.memberUserId, 'member-b');
	for (const path of [
		'communities/alpha/members/member-b',
		'users/member-b/communityMemberships/alpha',
	])
		assert.equal(
			(await database.doc(path).get()).data().lifecycle.status,
			'Removed',
		);
	const removal = (
		await database.doc('communities/alpha/memberRemovals/member-b').get()
	).data();
	assert.equal(removal.privateReason, 'Private safety context.');
	assert.equal(
		JSON.stringify(
			await readers.listCommunityMembersForAccount(
				'owner',
				{ communityId: 'alpha' },
				database,
			),
		).includes('Private safety context.'),
		false,
	);
	assert.deepEqual(
		(await database.doc('users/member-a/journeys/private').get()).data(),
		privateJourney,
	);
});

test('transfers exactly one organizer atomically and immediately changes invitation authority', async () => {
	await seedCommunity();
	const issued = await invitations.issueCommunityInvitationForAccount(
		'owner',
		{ communityId: 'alpha', operationId: 'issue-1' },
		invitationDependencies(),
	);
	const revision = (await database.doc('communities/alpha').get()).data()
		.revision;
	const transferred =
		await administration.transferCommunityOrganizerForAccount(
			'owner',
			{
				communityId: 'alpha',
				nextOrganizerUserId: 'member-a',
				expectedRevision: revision,
				operationId: 'transfer-1',
			},
			dependencies(nextNow),
		);
	assert.equal(transferred.community.organizer.userId, 'member-a');
	const members = await database
		.collection('communities/alpha/members')
		.get();
	assert.deepEqual(
		members.docs
			.filter((snapshot) => snapshot.data().role === 'Organizer')
			.map((snapshot) => snapshot.id),
		['member-a'],
	);
	await assert.rejects(
		invitations.getCurrentCommunityInvitationForAccount(
			'owner',
			{ communityId: 'alpha' },
			invitationDependencies(nextNow),
		),
		(error) => error.details.reason === 'OrganizerRequired',
	);
	assert.equal(
		(
			await invitations.getCurrentCommunityInvitationForAccount(
				'member-a',
				{ communityId: 'alpha' },
				invitationDependencies(nextNow),
			)
		).invitation.code,
		issued.invitation.code,
	);
	await assert.rejects(
		administration.transferCommunityOrganizerForAccount(
			'owner',
			{
				communityId: 'alpha',
				nextOrganizerUserId: 'member-a',
				expectedRevision: revision,
				operationId: 'transfer-1',
			},
			dependencies(nextNow),
		),
		(error) => error.details.reason === 'OrganizerRequired',
	);
});

test('serializes transfer/remove/close races and preserves a valid terminal state', async () => {
	await seedCommunity();
	const outcomes = await Promise.allSettled([
		administration.transferCommunityOrganizerForAccount(
			'owner',
			{
				communityId: 'alpha',
				nextOrganizerUserId: 'member-a',
				expectedRevision: 0,
				operationId: 'race-transfer',
			},
			dependencies(),
		),
		administration.removeCommunityMemberForAccount(
			'owner',
			{
				communityId: 'alpha',
				memberUserId: 'member-b',
				privateReason: 'Concurrent safety action.',
				operationId: 'race-remove',
			},
			dependencies(),
		),
		administration.closeCommunityForAccount(
			'owner',
			{
				communityId: 'alpha',
				expectedRevision: 0,
				operationId: 'race-close',
			},
			dependencies(),
		),
	]);
	assert.ok(outcomes.some((outcome) => outcome.status === 'fulfilled'));
	const community = (await database.doc('communities/alpha').get()).data();
	assert.ok(['Active', 'Closed'].includes(community.lifecycle.status));
	const members = await database
		.collection('communities/alpha/members')
		.get();
	const activeOrganizers = members.docs.filter(
		(snapshot) =>
			snapshot.data().role === 'Organizer' &&
			snapshot.data().lifecycle.status === 'Active',
	);
	assert.equal(activeOrganizers.length, 1);
	assert.equal(activeOrganizers[0].id, community.organizerUserId);
});

test('closure invalidates acceptance, retains archive reads, blocks administration, and leaves journeys byte-for-byte unchanged', async () => {
	await seedCommunity();
	const privateJourney = {
		userId: 'member-a',
		state: { status: 'Active' },
		privateWriting: 'Private reflection.',
		practiceCompletion: { Prayer: true },
	};
	await database.doc('users/member-a/journeys/private').set(privateJourney);
	const issued = await invitations.issueCommunityInvitationForAccount(
		'owner',
		{ communityId: 'alpha', operationId: 'issue-close' },
		invitationDependencies(),
	);
	const revision = (await database.doc('communities/alpha').get()).data()
		.revision;
	const request = {
		communityId: 'alpha',
		expectedRevision: revision,
		operationId: 'close-1',
	};
	const closed = await administration.closeCommunityForAccount(
		'owner',
		request,
		dependencies(nextNow),
	);
	assert.deepEqual(
		await administration.closeCommunityForAccount(
			'owner',
			request,
			dependencies(nextNow),
		),
		closed,
	);
	const community = (await database.doc('communities/alpha').get()).data();
	assert.equal(community.lifecycle.status, 'Closed');
	assert.equal(community.activeInvitationId, null);
	assert.equal(
		(
			await database
				.doc(
					`communities/alpha/invitations/${issued.invitation.invitationId}`,
				)
				.get()
		).data().lifecycle.status,
		'Revoked',
	);
	const context = await readers.getCommunityContextForAccount(
		'member-a',
		{ communityId: 'alpha' },
		database,
	);
	assert.equal(context.context.community.status, 'Closed');
	assert.deepEqual(context.context.capabilities, {
		canReadMembers: true,
		canCreatePost: false,
		canInviteMembers: false,
		canManageMembers: false,
		canEditCommunity: false,
		canCloseCommunity: false,
		canLeaveCommunity: true,
	});
	await assert.rejects(
		redemptions.acceptCommunityInvitationForAccount(
			'member-a',
			{
				invitationCode: issued.invitation.code,
				displayName: 'Member A',
				operationId: 'accept-closed',
			},
			{
				database,
				now: nextNow,
				requestScopeDigest: 'a'.repeat(64),
			},
		),
		(error) => error.details.reason === 'InvitationUnavailable',
	);
	await assert.rejects(
		administration.updateCommunityForAccount(
			'owner',
			{
				communityId: 'alpha',
				name: 'No update',
				purpose: '',
				settings: {},
				expectedRevision: community.revision,
				operationId: 'closed-update',
			},
			dependencies(nextNow),
		),
		(error) => error.details.reason === 'CommunityClosed',
	);
	assert.deepEqual(
		(await database.doc('users/member-a/journeys/private').get()).data(),
		privateJourney,
	);
	await administration.leaveCommunityForAccount(
		'owner',
		{ communityId: 'alpha', operationId: 'leave-closed' },
		dependencies(nextNow),
	);
	assert.equal(
		(await database.doc('communities/alpha/members/owner').get()).data()
			.lifecycle.status,
		'Left',
	);
});
