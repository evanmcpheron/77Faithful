const assert = require('node:assert/strict');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { deleteApp, initializeApp } = require(
	require.resolve('firebase-admin/app', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const { getFirestore, Timestamp } = require(
	require.resolve('firebase-admin/firestore', {
		paths: [path.join(__dirname, '../functions')],
	}),
);
const installations = require('../functions/lib/src/community/community-push-installation');
const events = require('../functions/lib/src/community/community-notification-event');
const push = require('../functions/lib/src/community/community-push-delivery');

const now = Timestamp.fromMillis(Date.UTC(2026, 8, 15, 12));
const installationId = 'ABCDEFGHIJKLMNOPQRST';
const secret = 'a'.repeat(64);
const token = 'ExpoPushToken[abcdefghijklmnopqrstuv]';
let app;
let database;
before(() => {
	if (!process.env.FIRESTORE_EMULATOR_HOST) return;
	app = initializeApp({ projectId: 'faithful-community-push-test' });
	database = getFirestore(app);
});
after(async () => {
	if (app) await deleteApp(app);
});
const registration = (operationId, changes = {}) => ({
	installationId,
	installationSecret: secret,
	operationId,
	token,
	permission: 'Granted',
	deliveryEnabled: true,
	...changes,
});
const setup = async () => {
	for (const userId of ['owner', 'actor', 'other'])
		await database.doc(`users/${userId}`).set({ preferredName: userId });
	await database
		.doc('communities/church')
		.set({ lifecycle: { status: 'Active' } });
	for (const userId of ['owner', 'actor'])
		await database.doc(`communities/church/members/${userId}`).set({
			communityId: 'church',
			userId,
			joinedAt: Timestamp.fromMillis(now.toMillis() - 1000),
			lifecycle: { status: 'Active' },
		});
	await database.doc('communities/church/posts/post').set({
		communityId: 'church',
		author: { userId: 'owner' },
		publication: {
			status: 'Published',
			content: { postType: 'Discussion', text: 'private post words' },
		},
	});
	await database.doc('communities/church/posts/post/replies/reply').set({
		communityId: 'church',
		postId: 'post',
		author: { userId: 'actor' },
		publication: { status: 'Published', text: 'private reply words' },
	});
	await database
		.doc('users/owner/communityNotificationPreferences/church')
		.set({
			communityId: 'church',
			pushEnabled: true,
			categories: {
				Reply: true,
				PrayerSupport: false,
				Announcement: false,
			},
		});
};
const event = async (sourceId = 'reply') => {
	if (sourceId !== 'reply')
		await database
			.doc(`communities/church/posts/post/replies/${sourceId}`)
			.set({
				communityId: 'church',
				postId: 'post',
				author: { userId: 'actor' },
				publication: {
					status: 'Published',
					text: 'private reply words',
				},
			});
	const eventId = events.notificationEventId(
		'Reply',
		'church',
		'post',
		sourceId,
	);
	await database.doc(`communityNotificationEvents/${eventId}`).set({
		schemaVersion: 1,
		communityId: 'church',
		postId: 'post',
		replyId: sourceId,
		actorUserId: 'actor',
		category: 'Reply',
		createdAt: now,
		cursorUserId: null,
		status: 'Pending',
	});
	await events.fanOutCommunityNotificationEvent(eventId, database);
	const task = await database
		.collection('communityPushDeliveries')
		.where('eventId', '==', eventId)
		.get();
	assert.equal(task.size, 1);
	return task.docs[0];
};
const transport = (responses, calls) => async (url, body, accessToken) => {
	assert.equal(accessToken, 'test-access-token');
	assert.equal(url.startsWith('https://exp.host/--/api/v2/push/'), true);
	assert.equal(JSON.stringify(body).includes('private'), false);
	calls.push({ url, body });
	return responses.shift();
};

test('registration enforces installation secret, account rebind, refresh, and owner-only removal', async (t) => {
	if (!database) return t.skip('Firestore emulator unavailable');
	await setup();
	const first =
		await installations.registerCommunityPushInstallationForAccount(
			'owner',
			registration('first'),
			database,
			now,
		);
	assert.equal(first.registered, true);
	assert.equal(
		(
			await database
				.doc(`communityPushInstallations/${installationId}`)
				.get()
		).get('userId'),
		'owner',
	);
	await assert.rejects(
		installations.registerCommunityPushInstallationForAccount(
			'other',
			registration('wrong', { installationSecret: 'b'.repeat(64) }),
			database,
			now,
		),
	);
	await installations.registerCommunityPushInstallationForAccount(
		'other',
		registration('switch'),
		database,
		now,
	);
	assert.equal(
		(
			await database
				.doc(`communityPushInstallations/${installationId}`)
				.get()
		).get('userId'),
		'other',
	);
	await assert.rejects(
		installations.unregisterCommunityPushInstallationForAccount(
			'owner',
			{
				installationId,
				installationSecret: secret,
				operationId: 'oldlogout',
			},
			database,
			now,
		),
	);
	await installations.registerCommunityPushInstallationForAccount(
		'owner',
		registration('return', { token: 'ExpoPushToken[newtoken123456789]' }),
		database,
		now,
	);
	await installations.registerCommunityPushInstallationForAccount(
		'owner',
		registration('denied', {
			token: null,
			permission: 'Denied',
			deliveryEnabled: false,
		}),
		database,
		now,
	);
	assert.equal(
		(
			await database
				.doc(`communityPushInstallations/${installationId}`)
				.get()
		).get('token'),
		null,
	);
	await assert.rejects(
		installations.registerCommunityPushInstallationForAccount(
			'owner',
			registration('denied'),
			database,
			now,
		),
	);
	await installations.unregisterCommunityPushInstallationForAccount(
		'owner',
		{ installationId, installationSecret: secret, operationId: 'logout' },
		database,
		now,
	);
	assert.equal(
		(
			await database
				.doc(`communityPushInstallations/${installationId}`)
				.get()
		).exists,
		false,
	);
});

test('sender rechecks mute, blocks, source, receipt, retries, and token retirement using mocked Expo transport', async (t) => {
	if (!database) return t.skip('Firestore emulator unavailable');
	await installations.registerCommunityPushInstallationForAccount(
		'owner',
		registration('ready'),
		database,
		now,
	);
	const task = await event();
	const calls = [];
	const mock = transport(
		[
			{ status: 200, body: { data: [{ status: 'ok', id: 'ticket-1' }] } },
			{ status: 200, body: { data: { 'ticket-1': { status: 'ok' } } } },
		],
		calls,
	);
	await push.processCommunityPushSend(
		task.id,
		database,
		mock,
		'test-access-token',
		now,
	);
	assert.equal(calls.length, 1);
	assert.deepEqual(calls[0].body.data, { notificationId: task.id });
	assert.equal((await task.ref.get()).get('status'), 'AwaitReceipt');
	await push.processCommunityPushReceipt(
		task.id,
		database,
		mock,
		'test-access-token',
		Timestamp.fromMillis(now.toMillis() + 16 * 60 * 1000),
	);
	assert.equal((await task.ref.get()).get('status'), 'Complete');
	assert.equal(calls.length, 2);

	await database
		.doc('communities/church/posts/post/replies/reply')
		.update({ 'publication.status': 'AuthorDeleted' });
	const retired = await database
		.collection('communityPushDeliveries')
		.where('eventId', '==', task.get('eventId'))
		.get();
	assert.equal(retired.size, 1);
	// A retry after source removal never submits a second push.
	await task.ref.update({ status: 'Pending', nextAttemptAt: now });
	await push.processCommunityPushSend(
		task.id,
		database,
		mock,
		'test-access-token',
		now,
	);
	assert.equal(calls.length, 2);
	assert.equal((await task.ref.get()).get('status'), 'Complete');
});

test('changed preference or block suppresses send; provider errors back off or permanently stop', async (t) => {
	if (!database) return t.skip('Firestore emulator unavailable');
	await setup();
	await installations.registerCommunityPushInstallationForAccount(
		'owner',
		registration('ready2'),
		database,
		now,
	);
	const muted = await event('muted');
	await database
		.doc('users/owner/communityNotificationPreferences/church')
		.update({ 'categories.Reply': false });
	const calls = [];
	await push.processCommunityPushSend(
		muted.id,
		database,
		transport([], calls),
		'test-access-token',
		now,
	);
	assert.equal(calls.length, 0);
	assert.equal((await muted.ref.get()).get('status'), 'Complete');
	await database
		.doc('users/owner/communityNotificationPreferences/church')
		.update({ 'categories.Reply': true });
	const blocked = await event('blocked');
	await database
		.doc('users/owner/communityBlocks/actor')
		.set({ createdAt: now });
	await push.processCommunityPushSend(
		blocked.id,
		database,
		transport([], calls),
		'test-access-token',
		now,
	);
	assert.equal(calls.length, 0);
	assert.equal((await blocked.ref.get()).get('status'), 'Complete');
	await database.doc('users/owner/communityBlocks/actor').delete();
	const rate = await event('rate');
	await rate.ref.update({ status: 'Sending', nextAttemptAt: now });
	await push.processCommunityPushSend(
		rate.id,
		database,
		transport(
			[
				{
					status: 429,
					body: { errors: [{ code: 'TOO_MANY_REQUESTS' }] },
				},
			],
			calls,
		),
		'test-access-token',
		now,
	);
	assert.equal((await rate.ref.get()).get('status'), 'Pending');
	assert.equal((await rate.ref.get()).get('attempts'), 1);
	await push.processCommunityPushSend(
		rate.id,
		database,
		transport([], calls),
		'test-access-token',
		now,
	);
	assert.equal(calls.length, 1);
	const credentials = await event('credentials');
	await push.processCommunityPushSend(
		credentials.id,
		database,
		transport(
			[{ status: 401, body: { errors: [{ code: 'UNAUTHORIZED' }] } }],
			calls,
		),
		'test-access-token',
		now,
	);
	assert.equal((await credentials.ref.get()).get('status'), 'Complete');
	const missingReceipt = await event('missingReceipt');
	await push.processCommunityPushSend(
		missingReceipt.id,
		database,
		transport(
			[
				{
					status: 200,
					body: { data: [{ status: 'ok', id: 'missing-ticket' }] },
				},
			],
			calls,
		),
		'test-access-token',
		now,
	);
	await push.processCommunityPushReceipt(
		missingReceipt.id,
		database,
		transport(
			[
				{
					status: 503,
					body: { errors: [{ code: 'SERVICE_UNAVAILABLE' }] },
				},
			],
			calls,
		),
		'test-access-token',
		Timestamp.fromMillis(now.toMillis() + 16 * 60 * 1000),
	);
	assert.equal(
		(await missingReceipt.ref.get()).get('status'),
		'AwaitReceipt',
	);
	assert.equal(
		(await missingReceipt.ref.get()).get('ticketId'),
		'missing-ticket',
	);
	const permanent = await event('permanent');
	await push.processCommunityPushSend(
		permanent.id,
		database,
		transport(
			[
				{
					status: 200,
					body: {
						data: [
							{
								status: 'error',
								details: { error: 'DeviceNotRegistered' },
							},
						],
					},
				},
			],
			calls,
		),
		'test-access-token',
		now,
	);
	assert.equal((await permanent.ref.get()).get('status'), 'Complete');
	assert.equal(
		(
			await database
				.doc(`communityPushInstallations/${installationId}`)
				.get()
		).get('tokenStatus'),
		'Disabled',
	);
	await installations.registerCommunityPushInstallationForAccount(
		'owner',
		registration('rotated', {
			token: 'ExpoPushToken[rotatedtoken123456789]',
		}),
		database,
		now,
	);
	const receiptError = await event('receiptError');
	await push.processCommunityPushSend(
		receiptError.id,
		database,
		transport(
			[
				{
					status: 200,
					body: { data: [{ status: 'ok', id: 'receipt-ticket' }] },
				},
			],
			calls,
		),
		'test-access-token',
		now,
	);
	await push.processCommunityPushReceipt(
		receiptError.id,
		database,
		transport(
			[
				{
					status: 200,
					body: {
						data: {
							'receipt-ticket': {
								status: 'error',
								details: { error: 'DeviceNotRegistered' },
							},
						},
					},
				},
			],
			calls,
		),
		'test-access-token',
		Timestamp.fromMillis(now.toMillis() + 16 * 60 * 1000),
	);
	assert.equal((await receiptError.ref.get()).get('status'), 'Complete');
	assert.equal(
		(
			await database
				.doc(`communityPushInstallations/${installationId}`)
				.get()
		).get('tokenStatus'),
		'Disabled',
	);
	assert.equal(JSON.stringify(calls).includes('private'), false);
});
