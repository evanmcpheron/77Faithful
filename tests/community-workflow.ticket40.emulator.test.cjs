const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { deleteApp, initializeApp } = require(
	require.resolve('firebase-admin/app', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const { getAuth } = require(
	require.resolve('firebase-admin/auth', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const { getFirestore, Timestamp } = require(
	require.resolve('firebase-admin/firestore', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const invitationParser = require('../functions/lib/generated/features/communities/community-invitation');
const readerParser = require('../functions/lib/generated/features/communities/community-reader');

const projectId = process.env.GCLOUD_PROJECT;
const allowedHost = (value) =>
	/^(127\.0\.0\.1|localhost):\d+$/.test(value || '');
if (
	!projectId ||
	!projectId.startsWith('demo-') ||
	!allowedHost(process.env.FIREBASE_AUTH_EMULATOR_HOST) ||
	!allowedHost(process.env.FIRESTORE_EMULATOR_HOST) ||
	!allowedHost(process.env.FUNCTIONS_EMULATOR_HOST)
) {
	throw new Error(
		'Ticket 40 workflow requires local Auth, Firestore, and Functions emulators with a demo project.',
	);
}

let app;
let auth;
let database;
const syntheticPassword = 'ticket40-local-only-password';
const operationId = (label) => `ticket40-${label}`;

const call = async (name, token, data) => {
	const response = await fetch(
		`http://${process.env.FUNCTIONS_EMULATOR_HOST}/${projectId}/us-central1/${name}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ data }),
		},
	);
	const body = await response.json();
	return { status: response.status, body };
};

const success = async (name, token, data) => {
	const response = await call(name, token, data);
	assert.equal(
		response.status,
		200,
		`${name}: ${JSON.stringify(response.body)}`,
	);
	assert.ok(response.body.result, `${name} did not return a callable result`);
	return response.body.result;
};

const account = async (label) => {
	const email = `${label}@ticket40.synthetic.invalid`;
	const created = await auth.createUser({
		email,
		password: syntheticPassword,
		emailVerified: true,
	});
	const now = Timestamp.now();
	await database.doc(`users/${created.uid}`).set({
		schemaVersion: 1,
		revision: 0,
		preferredName: `Synthetic ${label}`,
		createdAt: now,
		updatedAt: now,
	});
	const response = await fetch(
		`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email,
				password: syntheticPassword,
				returnSecureToken: true,
			}),
		},
	);
	assert.equal(response.ok, true, await response.clone().text());
	return { uid: created.uid, token: (await response.json()).idToken };
};

before(() => {
	app = initializeApp({ projectId });
	auth = getAuth(app);
	database = getFirestore(app);
});
after(async () => {
	if (app) await deleteApp(app);
});

test('organizer and distinct members use real invitation, reader, post, and revocation payloads', async () => {
	const [organizer, memberB, memberC, outsiderD, removedE] =
		await Promise.all([
			account('organizer-a'),
			account('member-b'),
			account('member-c'),
			account('outsider-d'),
			account('removed-e'),
		]);
	const created = await success('createCommunity', organizer.token, {
		name: 'Synthetic Scripture Circle',
		purpose: 'Synthetic integration fixture only.',
		settings: {},
		operationId: operationId('create'),
	});
	const communityId = created.community.communityId;
	const issued = invitationParser.parseIssueCommunityInvitationResult(
		await success('issueCommunityInvitation', organizer.token, {
			communityId,
			operationId: operationId('issue'),
		}),
	).invitation;
	const retrieved = invitationParser.parseGetCurrentCommunityInvitationResult(
		await success('getCurrentCommunityInvitation', organizer.token, {
			communityId,
		}),
	).invitation;
	assert.equal(retrieved.code, issued.code);
	assert.deepEqual(Object.keys(issued.expiresAt).sort(), [
		'nanoseconds',
		'seconds',
	]);
	const preview = invitationParser.parsePreviewCommunityInvitationResult(
		await success('previewCommunityInvitation', memberB.token, {
			invitationCode: issued.code,
		}),
	).preview;
	assert.equal(preview.communityName, 'Synthetic Scripture Circle');
	assert.deepEqual(Object.keys(preview.expiresAt).sort(), [
		'nanoseconds',
		'seconds',
	]);
	for (const [label, participant] of [
		['b', memberB],
		['c', memberC],
		['e', removedE],
	]) {
		const accepted = invitationParser.parseAcceptCommunityInvitationResult(
			await success('acceptCommunityInvitation', participant.token, {
				invitationCode: issued.code,
				displayName: `Synthetic ${label}`,
				operationId: operationId(`accept-${label}`),
			}),
		);
		assert.equal(accepted.outcome, 'Accepted');
	}
	const context = readerParser.parseGetCommunityContextResult(
		await success('getCommunityContext', memberB.token, { communityId }),
	);
	assert.equal(context.context.community.communityId, communityId);
	const members = readerParser.parseListCommunityMembersResult(
		await success('listCommunityMembers', memberB.token, {
			communityId,
			pageSize: 10,
		}),
	);
	assert.equal(members.members.length, 4);
	const outsiderRead = await call('getCommunityContext', outsiderD.token, {
		communityId,
	});
	assert.equal(outsiderRead.status, 403);
	const createdPost = await success('createCommunityPost', memberB.token, {
		communityId,
		content: {
			postType: 'SharedReflectionCopy',
			text: 'SYNTHETIC SHARED COPY; no private source link.',
		},
		operationId: operationId('post-copy'),
	});
	const createdAtKeys = Object.keys(createdPost.createdAt).sort();
	const post = await success('getCommunityPost', memberC.token, {
		communityId,
		postId: createdPost.postId,
	});
	assert.equal(
		JSON.stringify(post).includes(
			'SYNTHETIC SHARED COPY; no private source link.',
		),
		true,
	);
	const removal = await success('removeCommunityMember', organizer.token, {
		communityId,
		memberUserId: removedE.uid,
		privateReason: 'SYNTHETIC REMOVAL FIXTURE',
		operationId: operationId('remove-e'),
	});
	assert.equal(removal.memberUserId, removedE.uid);
	const removedRead = await call('getCommunityContext', removedE.token, {
		communityId,
	});
	assert.equal(removedRead.status, 403);
	const revoked = invitationParser.parseRevokeCommunityInvitationResult(
		await success('revokeCommunityInvitation', organizer.token, {
			communityId,
			invitationId: issued.invitationId,
			operationId: operationId('revoke'),
		}),
	);
	assert.equal(revoked.invitationId, issued.invitationId);
	const empty = invitationParser.parseGetCurrentCommunityInvitationResult(
		await success('getCurrentCommunityInvitation', organizer.token, {
			communityId,
		}),
	);
	assert.equal(empty.invitation, null);
	const denied = await call('acceptCommunityInvitation', outsiderD.token, {
		invitationCode: issued.code,
		displayName: 'Synthetic d',
		operationId: operationId('accept-after-revoke'),
	});
	assert.notEqual(denied.status, 200);
	assert.deepEqual(
		createdAtKeys,
		['nanoseconds', 'seconds'],
		`createCommunityPost.createdAt leaked an SDK timestamp: ${JSON.stringify(createdPost.createdAt)}`,
	);
});
