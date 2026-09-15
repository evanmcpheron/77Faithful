const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, test } = require('node:test');
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
const events = require('../functions/lib/src/community/community-notification-event');
const notifications = require('../functions/lib/src/community/community-notification');
const posts = require('../functions/lib/src/community/community-post');
const threads = require('../functions/lib/src/community/community-thread');

const projectId = 'faithful-community-notification-test';
const now = Timestamp.fromMillis(Date.UTC(2026, 8, 15, 12));
let app;
let database;
before(() => {
	if (!process.env.FIRESTORE_EMULATOR_HOST) return;
	app = initializeApp({ projectId });
	database = getFirestore(app);
});
after(async () => {
	if (app) await deleteApp(app);
});
const seed = async () => {
	for (const userId of ['owner', 'replyer', 'participant', 'late'])
		await database.doc(`users/${userId}`).set({ preferredName: userId });
	await database.doc('communities/church').set({
		schemaVersion: 1,
		lifecycle: { status: 'Active' },
		organizerUserId: 'owner',
	});
	for (const userId of ['owner', 'replyer', 'participant', 'late'])
		await database.doc(`communities/church/members/${userId}`).set({
			schemaVersion: 1,
			communityId: 'church',
			userId,
			role: userId === 'owner' ? 'Organizer' : 'Member',
			joinedAt:
				userId === 'late'
					? Timestamp.fromMillis(now.toMillis() + 1000)
					: Timestamp.fromMillis(now.toMillis() - 5000),
			lifecycle: { status: 'Active' },
		});
	await database.doc('communities/church/posts/post').set({
		schemaVersion: 1,
		communityId: 'church',
		author: { userId: 'owner' },
		publication: {
			status: 'Published',
			content: { postType: 'Discussion', text: 'sensitive post' },
		},
	});
	await database.doc('communities/church/posts/post/replies/older').set({
		schemaVersion: 1,
		communityId: 'church',
		postId: 'post',
		author: { userId: 'participant' },
		publication: { status: 'Published', text: 'sensitive reply' },
		createdAt: Timestamp.fromMillis(now.toMillis() - 1000),
	});
	await database.doc('communities/church/posts/post/replies/new').set({
		schemaVersion: 1,
		communityId: 'church',
		postId: 'post',
		author: { userId: 'replyer' },
		publication: { status: 'Published', text: 'secret words' },
		createdAt: now,
	});
};
test('bounded fan-out selects author and prior participant, suppresses actor and late joiner, and retries without duplicates', async (t) => {
	if (!database) return t.skip('Firestore emulator unavailable');
	await seed();
	const eventId = events.notificationEventId(
		'Reply',
		'church',
		'post',
		'new',
	);
	await database.doc(`communityNotificationEvents/${eventId}`).set({
		schemaVersion: 1,
		communityId: 'church',
		postId: 'post',
		replyId: 'new',
		actorUserId: 'replyer',
		category: 'Reply',
		createdAt: now,
		cursorUserId: null,
		status: 'Pending',
	});
	await events.fanOutCommunityNotificationEvent(eventId, database);
	await events.fanOutCommunityNotificationEvent(eventId, database);
	assert.equal(
		(
			await database
				.doc(`users/owner/communityNotifications/${eventId}`)
				.get()
		).exists,
		true,
	);
	assert.equal(
		(
			await database
				.doc(`users/participant/communityNotifications/${eventId}`)
				.get()
		).exists,
		true,
	);
	assert.equal(
		(
			await database
				.doc(`users/replyer/communityNotifications/${eventId}`)
				.get()
		).exists,
		false,
	);
	assert.equal(
		(
			await database
				.doc(`users/late/communityNotifications/${eventId}`)
				.get()
		).exists,
		false,
	);
	const raw = JSON.stringify(
		(
			await database
				.doc(`users/owner/communityNotifications/${eventId}`)
				.get()
		).data(),
	);
	assert.equal(raw.includes('sensitive'), false);
	assert.equal(raw.includes('secret'), false);
	const secondNow = Timestamp.fromMillis(now.toMillis() + 500);
	await database.doc('communities/church/posts/post/replies/second').set({
		schemaVersion: 1,
		communityId: 'church',
		postId: 'post',
		author: { userId: 'owner' },
		publication: {
			status: 'Published',
			text: 'different private text',
		},
		createdAt: secondNow,
	});
	const secondEventId = events.notificationEventId(
		'Reply',
		'church',
		'post',
		'second',
	);
	await database.doc(`communityNotificationEvents/${secondEventId}`).set({
		schemaVersion: 1,
		communityId: 'church',
		postId: 'post',
		replyId: 'second',
		actorUserId: 'owner',
		category: 'Reply',
		createdAt: secondNow,
		cursorUserId: null,
		status: 'Pending',
	});
	await events.fanOutCommunityNotificationEvent(secondEventId, database);
	const participantFirstPage =
		await notifications.listCommunityNotificationsForAccount(
			'participant',
			{ pageSize: 1 },
			database,
		);
	assert.equal(participantFirstPage.notifications.length, 1);
	assert.equal(participantFirstPage.unreadCount, 2);
	assert.ok(participantFirstPage.nextCursor);
	const participantSecondPage =
		await notifications.listCommunityNotificationsForAccount(
			'participant',
			{ pageSize: 1, cursor: participantFirstPage.nextCursor },
			database,
		);
	assert.equal(participantSecondPage.notifications.length, 1);
	assert.equal(participantSecondPage.unreadCount, 2);
	await assert.rejects(
		() =>
			notifications.listCommunityNotificationsForAccount(
				'owner',
				{ pageSize: 1, cursor: participantFirstPage.nextCursor },
				database,
			),
		(error) => error.code === 'invalid-argument',
	);
	const first = await notifications.listCommunityNotificationsForAccount(
		'owner',
		{},
		database,
	);
	assert.equal(first.notifications.length, 1);
	assert.equal(first.unreadCount, 1);
	await notifications.markCommunityNotificationReadForAccount(
		'owner',
		{ eventId, operationId: 'read1' },
		database,
		now,
	);
	assert.equal(
		(
			await notifications.listCommunityNotificationsForAccount(
				'owner',
				{},
				database,
			)
		).unreadCount,
		0,
	);
	assert.equal(
		(
			await notifications.openCommunityNotificationForAccount(
				'owner',
				{ eventId },
				database,
			)
		).status,
		'Available',
	);
	await database
		.doc('users/owner/communityBlocks/replyer')
		.set({ ownerUserId: 'owner', blockedUserId: 'replyer' });
	assert.equal(
		(
			await notifications.listCommunityNotificationsForAccount(
				'owner',
				{},
				database,
			)
		).notifications.length,
		0,
	);
	assert.equal(
		(
			await notifications.openCommunityNotificationForAccount(
				'owner',
				{ eventId },
				database,
			)
		).status,
		'Unavailable',
	);
});

test('verified source mutations create only first support and original announcement events; preferences and rejoin hide stale history', async (t) => {
	if (!database) return t.skip('Firestore emulator unavailable');
	await database.doc('communities/church2').set({
		schemaVersion: 1,
		lifecycle: { status: 'Active' },
		organizerUserId: 'owner',
	});
	for (const userId of ['owner', 'replyer'])
		await database.doc(`communities/church2/members/${userId}`).set({
			schemaVersion: 1,
			communityId: 'church2',
			userId,
			role: userId === 'owner' ? 'Organizer' : 'Member',
			joinedAt: Timestamp.fromMillis(now.toMillis() - 5000),
			lifecycle: { status: 'Active' },
		});
	const prayer = await posts.createCommunityPostForAccount(
		'replyer',
		{
			communityId: 'church2',
			content: {
				postType: 'PrayerRequest',
				text: 'private words',
				prayerRequestStatus: 'Current',
			},
			operationId: 'prayer1',
		},
		{ database, now },
	);
	const support = {
		communityId: 'church2',
		postId: prayer.postId,
		isPraying: true,
		operationId: 'support1',
	};
	await threads.setCommunityPrayerAcknowledgmentForAccount('owner', support, {
		database,
		now: Timestamp.fromMillis(now.toMillis() + 1000),
	});
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'owner',
		{ ...support, isPraying: false, operationId: 'support2' },
		{ database, now: Timestamp.fromMillis(now.toMillis() + 2000) },
	);
	await threads.setCommunityPrayerAcknowledgmentForAccount(
		'owner',
		{ ...support, operationId: 'support3' },
		{ database, now: Timestamp.fromMillis(now.toMillis() + 3000) },
	);
	const supportEvents = await database
		.collection('communityNotificationEvents')
		.where('communityId', '==', 'church2')
		.where('category', '==', 'PrayerSupport')
		.get();
	assert.equal(supportEvents.size, 1);
	const announcement = await posts.createCommunityPostForAccount(
		'owner',
		{
			communityId: 'church2',
			content: {
				postType: 'OrganizerAnnouncement',
				text: 'secret announcement',
			},
			operationId: 'announce1',
		},
		{ database, now },
	);
	const announcementEvents = await database
		.collection('communityNotificationEvents')
		.where('communityId', '==', 'church2')
		.where('category', '==', 'Announcement')
		.get();
	assert.equal(announcementEvents.size, 1);
	assert.equal(announcementEvents.docs[0].data().postId, announcement.postId);
	await posts.editCommunityPostForAccount(
		'owner',
		{
			communityId: 'church2',
			postId: announcement.postId,
			text: 'Changed announcement',
			expectedRevision: 0,
			operationId: 'announce-edit',
		},
		{ database, now: Timestamp.fromMillis(now.toMillis() + 1000) },
	);
	assert.equal(
		(
			await database
				.collection('communityNotificationEvents')
				.where('communityId', '==', 'church2')
				.where('category', '==', 'Announcement')
				.get()
		).size,
		1,
	);
	const preference =
		await notifications.getCommunityNotificationPreferencesForAccount(
			'replyer',
			{ communityId: 'church2' },
			database,
		);
	assert.deepEqual(preference.categories, {
		Reply: false,
		PrayerSupport: false,
		Announcement: false,
	});
	assert.equal(preference.pushEnabled, false);
	const request = {
		communityId: 'church2',
		category: 'Announcement',
		categoryEnabled: false,
		pushEnabled: false,
		operationId: 'mute1',
	};
	await notifications.setCommunityNotificationPreferencesForAccount(
		'replyer',
		request,
		database,
		now,
	);
	await assert.rejects(
		() =>
			notifications.setCommunityNotificationPreferencesForAccount(
				'replyer',
				{ ...request, categoryEnabled: true },
				database,
				now,
			),
		(error) => error.code === 'already-exists',
	);
	await events.fanOutCommunityNotificationEvent(
		announcementEvents.docs[0].id,
		database,
	);
	assert.equal(
		(
			await notifications.listCommunityNotificationsForAccount(
				'replyer',
				{},
				database,
			)
		).notifications.length,
		1,
		'push mute keeps in-app history',
	);
	await database
		.doc('communities/church2/members/replyer')
		.update({ joinedAt: Timestamp.fromMillis(now.toMillis() + 5000) });
	assert.equal(
		(
			await notifications.listCommunityNotificationsForAccount(
				'replyer',
				{},
				database,
			)
		).unreadCount,
		0,
	);
	assert.equal(
		(
			await notifications.openCommunityNotificationForAccount(
				'replyer',
				{ eventId: announcementEvents.docs[0].id },
				database,
			)
		).status,
		'Unavailable',
	);
	await database
		.doc('communities/church2/members/replyer')
		.update({ joinedAt: Timestamp.fromMillis(now.toMillis() - 5000) });
	await database
		.doc(`communities/church2/posts/${announcement.postId}`)
		.update({
			publication: {
				status: 'AuthorDeleted',
				postType: 'OrganizerAnnouncement',
				deletedAt: now,
			},
		});
	assert.equal(
		(
			await notifications.openCommunityNotificationForAccount(
				'replyer',
				{ eventId: announcementEvents.docs[0].id },
				database,
			)
		).status,
		'Unavailable',
	);
});

test('partial fan-out resumes after a bounded page and delivers each recipient once', async (t) => {
	if (!database) return t.skip('Firestore emulator unavailable');
	await database.doc('communities/church3').set({
		schemaVersion: 1,
		lifecycle: { status: 'Active' },
		organizerUserId: 'owner',
	});
	for (let index = 0; index < 21; index++) {
		const userId = `member${String(index).padStart(2, '0')}`;
		await database.doc(`users/${userId}`).set({ preferredName: userId });
		await database.doc(`communities/church3/members/${userId}`).set({
			schemaVersion: 1,
			communityId: 'church3',
			userId,
			role: 'Member',
			joinedAt: Timestamp.fromMillis(now.toMillis() - 5000),
			lifecycle: { status: 'Active' },
		});
	}
	await database.doc('communities/church3/members/owner').set({
		schemaVersion: 1,
		communityId: 'church3',
		userId: 'owner',
		role: 'Organizer',
		joinedAt: Timestamp.fromMillis(now.toMillis() - 5000),
		lifecycle: { status: 'Active' },
	});
	await database.doc('communities/church3/posts/announcement').set({
		schemaVersion: 1,
		communityId: 'church3',
		postId: 'announcement',
		author: { userId: 'owner' },
		publication: {
			status: 'Published',
			content: {
				postType: 'OrganizerAnnouncement',
				text: 'private announcement words',
			},
		},
	});
	const eventId = events.notificationEventId(
		'Announcement',
		'church3',
		'announcement',
		'announcement',
	);
	await database.doc(`communityNotificationEvents/${eventId}`).set({
		schemaVersion: 1,
		communityId: 'church3',
		postId: 'announcement',
		replyId: null,
		actorUserId: 'owner',
		category: 'Announcement',
		createdAt: now,
		cursorUserId: null,
		status: 'Pending',
	});
	assert.equal(
		await events.fanOutCommunityNotificationEvent(eventId, database),
		false,
	);
	assert.equal(
		(
			await database.doc(`communityNotificationEvents/${eventId}`).get()
		).data().status,
		'Pending',
	);
	assert.equal(
		await events.fanOutCommunityNotificationEvent(eventId, database),
		true,
	);
	assert.equal(
		await events.fanOutCommunityNotificationEvent(eventId, database),
		true,
	);
	for (let index = 0; index < 21; index++) {
		const userId = `member${String(index).padStart(2, '0')}`;
		assert.equal(
			(
				await database
					.doc(`users/${userId}/communityNotifications/${eventId}`)
					.get()
			).exists,
			true,
		);
		assert.equal(
			(
				await database
					.collection(`users/${userId}/communityNotifications`)
					.get()
			).size,
			1,
		);
	}
});
