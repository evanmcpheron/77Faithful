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
const { getAuth: getAdminAuth } = require(
	require.resolve('firebase-admin/auth', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const {
	deleteApp: deleteClientApp,
	initializeApp: initializeClientApp,
} = require('firebase/app');
const {
	connectAuthEmulator,
	createUserWithEmailAndPassword,
	getAuth,
	signInWithEmailAndPassword,
	signOut,
} = require('firebase/auth');
const {
	collection,
	connectFirestoreEmulator,
	doc,
	getDoc,
	getDocs,
	getFirestore: getClientFirestore,
	setDoc,
} = require('firebase/firestore');

const projectId =
	process.env.GCLOUD_PROJECT || 'faithful-community-readers-test';
let database;
let readers;
let clientApp;
let clientAuth;
let clientDatabase;

const clearFirestore = async () => {
	const response = await fetch(
		`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
		{ method: 'DELETE' },
	);
	assert.equal(response.ok, true, await response.text());
};

const joinedAt = (offset) => new Timestamp(1700000000 + offset, 0);

const profile = async (userId, preferredName, privateFields = {}) => {
	await database.doc(`users/${userId}`).set({
		preferredName,
		contactEmail: `${userId}@private.example`,
		...privateFields,
	});
};

const community = async ({
	communityId,
	organizerUserId,
	status = 'Active',
	members,
}) => {
	await database.doc(`communities/${communityId}`).set({
		schemaVersion: 1,
		name: `Community ${communityId}`,
		purpose: 'Encourage one another.',
		organizerUserId,
		settings: { participationExpectations: 'Be gracious.' },
		lifecycle:
			status === 'Closed'
				? { status, closedAt: joinedAt(99) }
				: { status },
		revision: 0,
		createdAt: joinedAt(0),
		updatedAt: joinedAt(0),
		privateJourneyId: 'must-not-leak',
	});
	for (const [offset, member] of members.entries()) {
		const membership = {
			schemaVersion: 1,
			communityId,
			userId: member.storedUserId ?? member.userId,
			role: member.role,
			joinedAt: joinedAt(offset),
			lifecycle: { status: member.status ?? 'Active' },
			createdAt: joinedAt(offset),
			updatedAt: joinedAt(offset),
			privatePracticeDetails: ['must-not-leak'],
		};
		await database
			.doc(`communities/${communityId}/members/${member.userId}`)
			.set(membership);
		if (member.index !== false) {
			await database
				.doc(
					`users/${member.userId}/communityMemberships/${communityId}`,
				)
				.set(membership);
		}
	}
};

const verifiedAuth = (uid) => ({
	uid,
	token: { email_verified: true },
});

before(async () => {
	assert.ok(
		process.env.FIRESTORE_EMULATOR_HOST,
		'Run with the Firestore emulator.',
	);
	assert.ok(
		process.env.FIREBASE_AUTH_EMULATOR_HOST,
		'Run with the Auth emulator.',
	);
	initializeApp({ projectId });
	database = getFirestore();
	clientApp = initializeClientApp(
		{ apiKey: 'fake-api-key', projectId },
		'community-reader-rules-client',
	);
	clientAuth = getAuth(clientApp);
	connectAuthEmulator(
		clientAuth,
		`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
		{ disableWarnings: true },
	);
	clientDatabase = getClientFirestore(clientApp);
	const [firestoreHost, firestorePort] =
		process.env.FIRESTORE_EMULATOR_HOST.split(':');
	connectFirestoreEmulator(
		clientDatabase,
		firestoreHost,
		Number(firestorePort),
	);
	readers = require('../functions/lib/src/community/read-community-context');
});

beforeEach(clearFirestore);

after(async () => {
	await deleteClientApp(clientApp);
	await Promise.all(getApps().map(deleteApp));
});

test('denies verified clients direct community and private-index reads and writes', async () => {
	const email = 'rules-reader@example.com';
	const password = 'safe-test-password';
	const credential = await createUserWithEmailAndPassword(
		clientAuth,
		email,
		password,
	);
	await getAdminAuth().updateUser(credential.user.uid, {
		emailVerified: true,
	});
	await signOut(clientAuth);
	await signInWithEmailAndPassword(clientAuth, email, password);
	assert.equal(clientAuth.currentUser.emailVerified, true);
	await Promise.all([
		assert.rejects(getDoc(doc(clientDatabase, 'communities/alpha')), {
			code: 'permission-denied',
		}),
		assert.rejects(
			getDocs(collection(clientDatabase, 'communities/alpha/members')),
			{ code: 'permission-denied' },
		),
		assert.rejects(
			getDoc(
				doc(
					clientDatabase,
					`users/${credential.user.uid}/communityMemberships/alpha`,
				),
			),
			{ code: 'permission-denied' },
		),
		assert.rejects(
			setDoc(doc(clientDatabase, 'communities/alpha/posts/forged'), {
				body: 'forged',
			}),
			{ code: 'permission-denied' },
		),
		assert.rejects(
			getDoc(
				doc(
					clientDatabase,
					'communities/alpha/invitations/invitation-1',
				),
			),
			{ code: 'permission-denied' },
		),
		assert.rejects(
			getDoc(
				doc(
					clientDatabase,
					'communityInvitationDigests/private-digest',
				),
			),
			{ code: 'permission-denied' },
		),
		assert.rejects(
			setDoc(
				doc(
					clientDatabase,
					`users/${credential.user.uid}/communityInvitationIssueOperations/forged`,
				),
				{ invitationId: 'forged' },
			),
			{ code: 'permission-denied' },
		),
	]);
});

test('returns organizer and member context with server-derived capabilities', async () => {
	await Promise.all([profile('owner', 'Anna'), profile('member', 'Micah')]);
	await community({
		communityId: 'alpha',
		organizerUserId: 'owner',
		members: [
			{ userId: 'owner', role: 'Organizer' },
			{ userId: 'member', role: 'Member' },
		],
	});
	const organizer = await readers.getCommunityContextForAccount(
		'owner',
		{ communityId: 'alpha' },
		database,
	);
	const member = await readers.getCommunityContextForAccount(
		'member',
		{ communityId: 'alpha' },
		database,
	);
	assert.equal(organizer.context.membership.role, 'Organizer');
	assert.equal(organizer.context.capabilities.canInviteMembers, true);
	assert.equal(member.context.membership.role, 'Member');
	assert.equal(member.context.capabilities.canInviteMembers, false);
	assert.deepEqual(organizer.context.activeMemberCount, {
		value: 2,
		isExact: true,
	});
	for (const response of [organizer, member]) {
		const serialized = JSON.stringify(response);
		for (const prohibited of [
			'contactEmail',
			'privateJourneyId',
			'privatePracticeDetails',
			'@private.example',
		])
			assert.equal(serialized.includes(prohibited), false, prohibited);
	}
});

test('requires a verified, available account and authoritative active membership', async () => {
	await Promise.all([
		profile('owner', 'Anna'),
		profile('member', 'Micah'),
		profile('outsider', 'Noah'),
	]);
	await community({
		communityId: 'alpha',
		organizerUserId: 'owner',
		members: [
			{ userId: 'owner', role: 'Organizer' },
			{ userId: 'member', role: 'Member' },
		],
	});
	await assert.rejects(
		readers.getCommunityContext.run({ data: { communityId: 'alpha' } }),
		{ code: 'unauthenticated' },
	);
	await assert.rejects(
		readers.getCommunityContext.run({
			data: { communityId: 'alpha' },
			auth: { uid: 'member', token: { email_verified: false } },
		}),
		{ code: 'permission-denied' },
	);
	await assert.rejects(
		readers.getCommunityContext.run({
			data: { communityId: 'alpha' },
			auth: verifiedAuth('outsider'),
		}),
		{ code: 'permission-denied' },
	);
	await assert.rejects(
		readers.getCommunityContextForAccount(
			'missing-profile',
			{ communityId: 'alpha' },
			database,
		),
		{ code: 'failed-precondition' },
	);
});

test('denies leaving, left, and removed memberships and ignores stale account indexes', async () => {
	await profile('owner', 'Anna');
	for (const status of ['Leaving', 'Left', 'Removed']) {
		await clearFirestore();
		await profile('owner', 'Anna');
		await community({
			communityId: `status-${status}`,
			organizerUserId: 'owner',
			members: [{ userId: 'owner', role: 'Organizer', status }],
		});
		await assert.rejects(
			readers.getCommunityContextForAccount(
				'owner',
				{ communityId: `status-${status}` },
				database,
			),
			{ code: 'permission-denied' },
		);
	}
	await clearFirestore();
	await profile('owner', 'Anna');
	const staleMembership = {
		communityId: 'stale',
		userId: 'owner',
		role: 'Organizer',
		joinedAt: joinedAt(0),
		lifecycle: { status: 'Active' },
	};
	await database
		.doc('users/owner/communityMemberships/stale')
		.set(staleMembership);
	const page = await readers.listCommunityPageForAccount(
		'owner',
		{ pageSize: 10 },
		database,
	);
	assert.deepEqual(page, { communities: [], nextCursor: null });
});

test('keeps a closed community readable while removing content and organizer write capabilities', async () => {
	await profile('owner', 'Anna');
	await community({
		communityId: 'closed',
		organizerUserId: 'owner',
		status: 'Closed',
		members: [{ userId: 'owner', role: 'Organizer' }],
	});
	const { context } = await readers.getCommunityContextForAccount(
		'owner',
		{ communityId: 'closed' },
		database,
	);
	assert.equal(context.community.status, 'Closed');
	assert.equal(context.capabilities.canReadMembers, true);
	assert.equal(context.capabilities.canCreatePost, false);
	assert.equal(context.capabilities.canInviteMembers, false);
	assert.equal(context.capabilities.canManageMembers, false);
	assert.equal(context.capabilities.canEditCommunity, false);
	assert.equal(context.capabilities.canCloseCommunity, false);
	assert.equal(context.capabilities.canLeaveCommunity, true);
});

test('lists safe members in stable pages and uses an empty name for a missing profile', async () => {
	await Promise.all([profile('owner', 'Anna'), profile('member', 'Micah')]);
	await community({
		communityId: 'alpha',
		organizerUserId: 'owner',
		members: [
			{ userId: 'owner', role: 'Organizer' },
			{ userId: 'member', role: 'Member' },
			{ userId: 'missing-profile', role: 'Member' },
		],
	});
	const first = await readers.listCommunityMembersForAccount(
		'member',
		{ communityId: 'alpha', pageSize: 2 },
		database,
	);
	const second = await readers.listCommunityMembersForAccount(
		'member',
		{ communityId: 'alpha', pageSize: 2, cursor: first.nextCursor },
		database,
	);
	assert.equal(first.members.length, 2);
	assert.ok(first.nextCursor);
	assert.deepEqual(second, {
		members: [
			{
				communityId: 'alpha',
				userId: 'missing-profile',
				displayName: '',
				role: 'Member',
			},
		],
		nextCursor: null,
	});
	assert.equal(
		JSON.stringify([...first.members, ...second.members]).includes('@'),
		false,
	);
});

test('does not trust forged membership identities or organizer roles', async () => {
	await Promise.all([profile('owner', 'Anna'), profile('member', 'Micah')]);
	await community({
		communityId: 'alpha',
		organizerUserId: 'owner',
		members: [
			{ userId: 'owner', role: 'Organizer' },
			{ userId: 'member', role: 'Organizer' },
		],
	});
	const forgedRole = await readers.getCommunityContextForAccount(
		'member',
		{ communityId: 'alpha' },
		database,
	);
	assert.equal(forgedRole.context.membership.role, 'Member');
	assert.equal(forgedRole.context.capabilities.canManageMembers, false);
	await database.doc('communities/alpha/members/member').update({
		userId: 'owner',
	});
	await assert.rejects(
		readers.getCommunityContextForAccount(
			'member',
			{ communityId: 'alpha' },
			database,
		),
		{ code: 'permission-denied' },
	);
});

test('validates page limits and rejects malformed or cross-community cursors', async () => {
	await Promise.all([profile('owner', 'Anna'), profile('member', 'Micah')]);
	for (const communityId of ['alpha', 'beta']) {
		await community({
			communityId,
			organizerUserId: 'owner',
			members: [
				{ userId: 'owner', role: 'Organizer' },
				{ userId: 'member', role: 'Member' },
			],
		});
	}
	for (const pageSize of [0, 51, 1.5])
		await assert.rejects(
			readers.listCommunityMembersForAccount(
				'member',
				{ communityId: 'alpha', pageSize },
				database,
			),
			{ code: 'invalid-argument' },
		);
	await assert.rejects(
		readers.listCommunityMembersForAccount(
			'member',
			{ communityId: 'alpha', cursor: 'not-a-real-cursor' },
			database,
		),
		{ code: 'invalid-argument' },
	);
	const alpha = await readers.listCommunityMembersForAccount(
		'member',
		{ communityId: 'alpha', pageSize: 1 },
		database,
	);
	await assert.rejects(
		readers.listCommunityMembersForAccount(
			'member',
			{
				communityId: 'beta',
				pageSize: 1,
				cursor: alpha.nextCursor,
			},
			database,
		),
		{ code: 'invalid-argument' },
	);
});

test('denies cross-community member access even when the community ID is guessed', async () => {
	await Promise.all([profile('owner-a', 'Anna'), profile('owner-b', 'Beth')]);
	await community({
		communityId: 'alpha',
		organizerUserId: 'owner-a',
		members: [{ userId: 'owner-a', role: 'Organizer' }],
	});
	await community({
		communityId: 'beta',
		organizerUserId: 'owner-b',
		members: [{ userId: 'owner-b', role: 'Organizer' }],
	});
	await assert.rejects(
		readers.listCommunityMembersForAccount(
			'owner-a',
			{ communityId: 'beta' },
			database,
		),
		{ code: 'permission-denied' },
	);
});
