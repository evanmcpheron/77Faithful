const assert = require('node:assert/strict');
const { test } = require('node:test');
const parsers = require('../functions/lib/generated/features/communities/community-notification');
const events = require('../functions/lib/src/community/community-notification-event');

test('notification inputs are bounded, exact, and scoped', () => {
	assert.deepEqual(parsers.parseListCommunityNotificationsRequest({}), {
		pageSize: 20,
	});
	assert.deepEqual(
		parsers.parseListCommunityNotificationsRequest({ pageSize: 50 }),
		{ pageSize: 50 },
	);
	for (const value of [
		{ pageSize: 51 },
		{ pageSize: 0 },
		{ cursor: 'x'.repeat(513) },
		{ userId: 'another' },
	])
		assert.throws(() =>
			parsers.parseListCommunityNotificationsRequest(value),
		);
	assert.deepEqual(
		parsers.parseMarkCommunityNotificationReadRequest({
			eventId: 'event',
			operationId: 'retry',
		}),
		{ eventId: 'event', operationId: 'retry' },
	);
	assert.throws(() =>
		parsers.parseMarkCommunityNotificationReadRequest({
			eventId: 'event',
			operationId: 'retry',
			recipientId: 'another',
		}),
	);
	assert.deepEqual(
		parsers.parseSetCommunityNotificationPreferencesRequest({
			communityId: 'church',
			category: 'Reply',
			categoryEnabled: false,
			pushEnabled: false,
			operationId: 'set1',
		}).category,
		'Reply',
	);
	assert.throws(() =>
		parsers.parseSetCommunityNotificationPreferencesRequest({
			communityId: 'church',
			category: 'Other',
			categoryEnabled: true,
			pushEnabled: true,
			operationId: 'set1',
		}),
	);
});

test('event IDs deduplicate one source and distinguish categories and actors', () => {
	const first = events.notificationEventId(
		'PrayerSupport',
		'church',
		'post',
		'actor',
	);
	assert.equal(
		first,
		events.notificationEventId('PrayerSupport', 'church', 'post', 'actor'),
	);
	assert.notEqual(
		first,
		events.notificationEventId('PrayerSupport', 'church', 'post', 'other'),
	);
	assert.notEqual(
		first,
		events.notificationEventId('Reply', 'church', 'post', 'actor'),
	);
	assert.match(first, /^[a-f0-9]{64}$/);
});
