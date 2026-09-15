const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { initializeApp, deleteApp } = require(
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

const projectId =
	process.env.GCLOUD_PROJECT || 'demo-faithful-callable-security';
const functionsHost = process.env.FUNCTIONS_EMULATOR_HOST || '127.0.0.1:5001';
const communityCallableNames = [
	'acceptCommunityInvitation',
	'blockCommunityMember',
	'cancelCommunityJourney',
	'claimCommunitySafetyReport',
	'closeCommunity',
	'configureCommunityJourney',
	'createCommunity',
	'createCommunityPost',
	'createCommunityReply',
	'deleteCommunityPost',
	'deleteCommunityReply',
	'editCommunityPost',
	'editCommunityReply',
	'enrollCommunityJourney',
	'getCommunity',
	'getCommunityAggregateProgress',
	'getCommunityContext',
	'getCommunityJourneyCourseOption',
	'getCommunityJourneyEnrollment',
	'getCommunityJourneySchedule',
	'getCommunityNotificationPreferences',
	'getCommunityPost',
	'getCommunityProgressSharing',
	'getCommunitySafetyReport',
	'getCurrentCommunityInvitation',
	'issueCommunityInvitation',
	'leaveCommunity',
	'listBlockedCommunityMembers',
	'listCommunities',
	'listCommunityJourneyHistory',
	'listCommunityMembers',
	'listCommunityNotifications',
	'listCommunityPage',
	'listCommunityPosts',
	'listCommunityPrayerSupport',
	'listCommunityReplies',
	'listCommunitySafetyReports',
	'listOwnCommunityContributions',
	'listSharedCommunityProgress',
	'markCommunityNotificationRead',
	'openCommunityNotification',
	'openCommunityPushNotification',
	'previewCommunityInvitation',
	'registerCommunityPushInstallation',
	'removeCommunityMember',
	'reportCommunityContent',
	'retryCommunityJourneyActivation',
	'reviewCommunityReport',
	'reviseCommunityJourney',
	'revokeCommunityInvitation',
	'rotateCommunityInvitation',
	'setCommunityNotificationPreferences',
	'setCommunityPrayerAcknowledgment',
	'setCommunityPrayerRequestStatus',
	'setCommunityProgressSharing',
	'transferCommunityOrganizer',
	'unblockCommunityMember',
	'unregisterCommunityPushInstallation',
	'updateCommunity',
	'withdrawCommunityJourneyEnrollment',
];
let app;
let authentication;
let database;

const callable = async (name, token, data) => {
	const response = await fetch(
		`http://${functionsHost}/${projectId}/us-central1/${name}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ data }),
		},
	);
	return { status: response.status, body: await response.json() };
};

const createAccount = async (label, emailVerified = true) => {
	const email = `${label}@ticket39.example.test`;
	const password = 'local-test-password';
	const user = await authentication.createUser({
		email,
		password,
		emailVerified,
	});
	await database.doc(`users/${user.uid}`).set({
		schemaVersion: 1,
		revision: 0,
		preferredName: label,
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	});
	const response = await fetch(
		`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password, returnSecureToken: true }),
		},
	);
	assert.equal(response.ok, true, await response.clone().text());
	return { userId: user.uid, token: (await response.json()).idToken };
};

const seedMembership = async (communityId, userId, status = 'Active') => {
	const now = Timestamp.now();
	const membership = {
		schemaVersion: 1,
		communityId,
		userId,
		role: 'Member',
		joinedAt: now,
		lifecycle:
			status === 'Active'
				? { status }
				: status === 'Left'
					? { status, leftAt: now }
					: { status: 'Removed', removedAt: now },
		createdAt: now,
		updatedAt: now,
	};
	await Promise.all([
		database
			.doc(`communities/${communityId}/members/${userId}`)
			.set(membership),
		database
			.doc(`users/${userId}/communityMemberships/${communityId}`)
			.set(membership),
	]);
};

before(async () => {
	if (
		!process.env.FIRESTORE_EMULATOR_HOST ||
		!process.env.FIREBASE_AUTH_EMULATOR_HOST
	)
		return;
	app = initializeApp({ projectId });
	authentication = getAuth(app);
	database = getFirestore(app);
});
after(async () => {
	if (app) await deleteApp(app);
});

test('real callables recheck membership and current Auth state', async (t) => {
	if (!database)
		return t.skip('Auth/Firestore/Functions emulators unavailable');
	const owner = await createAccount('owner');
	const outsider = await createAccount('outsider');
	const unverified = await createAccount('unverified', false);
	const member = await createAccount('member');
	const future = await createAccount('future');
	const left = await createAccount('left');
	const removed = await createAccount('removed');
	const reviewer = await createAccount('reviewer');
	const created = await callable('createCommunity', owner.token, {
		name: 'Grace Church',
		purpose: '',
		settings: {},
		operationId: 'create1',
	});
	assert.equal(created.status, 200, JSON.stringify(created.body));
	const communityId = created.body.result.community.communityId;
	await Promise.all([
		seedMembership(communityId, member.userId),
		seedMembership(communityId, left.userId, 'Left'),
		seedMembership(communityId, removed.userId, 'Removed'),
	]);
	await database.doc(`users/${owner.userId}/journeys/private`).set({
		writing: 'never return private writing',
	});
	assert.equal(
		(await callable('getCommunity', owner.token, { communityId })).body
			.result.name,
		'Grace Church',
	);
	assert.equal(
		(await callable('getCommunity', member.token, { communityId })).body
			.result.name,
		'Grace Church',
	);
	for (const [token, data] of [
		[outsider.token, { communityId }],
		[future.token, { communityId }],
		[left.token, { communityId }],
		[removed.token, { communityId }],
		[unverified.token, { communityId }],
		[owner.token, { communityId, role: 'Organizer' }],
	]) {
		const denied = await callable('getCommunity', token, data);
		assert.notEqual(denied.status, 200, JSON.stringify(denied.body));
	}
	const forgedList = await callable('listCommunities', owner.token, {
		userId: outsider.userId,
	});
	assert.notEqual(forgedList.status, 200, JSON.stringify(forgedList.body));
	const posted = await callable('createCommunityPost', owner.token, {
		communityId,
		content: {
			postType: 'Discussion',
			text: 'Deliberately submitted copy',
		},
		operationId: 'post1',
	});
	assert.equal(posted.status, 200, JSON.stringify(posted.body));
	const postId = posted.body.result.postId;
	await seedMembership(communityId, future.userId);
	const futureRead = await callable('getCommunityPost', future.token, {
		communityId,
		postId,
	});
	assert.equal(futureRead.status, 200, JSON.stringify(futureRead.body));
	assert.equal(
		JSON.stringify(futureRead.body).includes(
			'never return private writing',
		),
		false,
	);
	await authentication.updateUser(future.userId, { emailVerified: false });
	const newlyUnverified = await callable('getCommunityPost', future.token, {
		communityId,
		postId,
	});
	assert.notEqual(
		newlyUnverified.status,
		200,
		'A currently unverified account retained community access',
	);
	const organizerReview = await callable(
		'listCommunitySafetyReports',
		owner.token,
		{},
	);
	assert.notEqual(
		organizerReview.status,
		200,
		JSON.stringify(organizerReview.body),
	);
	await authentication.setCustomUserClaims(reviewer.userId, {
		communitySafetyReviewer: true,
	});
	const reviewerRead = await callable(
		'listCommunitySafetyReports',
		reviewer.token,
		{},
	);
	assert.equal(reviewerRead.status, 200, JSON.stringify(reviewerRead.body));
	await authentication.setCustomUserClaims(reviewer.userId, {
		communitySafetyReviewer: false,
	});
	const revokedReviewer = await callable(
		'listCommunitySafetyReports',
		reviewer.token,
		{},
	);
	assert.notEqual(
		revokedReviewer.status,
		200,
		JSON.stringify(revokedReviewer.body),
	);
	await new Promise((resolve) => setTimeout(resolve, 1100));
	await authentication.revokeRefreshTokens(member.userId);
	const revokedSession = await callable('getCommunity', member.token, {
		communityId,
	});
	assert.notEqual(
		revokedSession.status,
		200,
		'A revoked sign-in session retained community access',
	);
	await authentication.updateUser(owner.userId, { disabled: true });
	const disabled = await callable('getCommunity', owner.token, {
		communityId,
	});
	assert.notEqual(
		disabled.status,
		200,
		'A disabled account retained community access',
	);
	const disabledRetry = await callable('createCommunity', owner.token, {
		name: 'Grace Church',
		purpose: '',
		settings: {},
		operationId: 'create1',
	});
	assert.equal(disabledRetry.status, 403, JSON.stringify(disabledRetry.body));
	for (const name of communityCallableNames) {
		const denied = await callable(name, owner.token, {});
		assert.equal(
			denied.status,
			403,
			`${name}: ${JSON.stringify(denied.body)}`,
		);
		assert.equal(
			denied.body.error.details.reason,
			'AccountUnavailable',
			name,
		);
	}
	await authentication.deleteUser(owner.userId);
	const deleted = await callable('getCommunity', owner.token, {
		communityId,
	});
	assert.notEqual(
		deleted.status,
		200,
		'A deleted account retained community access',
	);
});
