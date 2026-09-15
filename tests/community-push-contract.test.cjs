const assert = require('node:assert/strict');
const { test } = require('node:test');
const parsers = require('../functions/lib/generated/features/communities/community-push');
const delivery = require('../functions/lib/src/community/community-push-delivery');

const installationId = 'ABCDEFGHIJKLMNOPQRST';
const installationSecret = 'a'.repeat(64);
const token = 'ExpoPushToken[abcdefghijklmnopqrstuv]';
const registration = {
	installationId,
	installationSecret,
	operationId: 'register1',
	token,
	permission: 'Granted',
	deliveryEnabled: true,
};

test('push registration and removal require exact bounded installation state', () => {
	assert.deepEqual(
		parsers.parseRegisterCommunityPushInstallationRequest(registration),
		registration,
	);
	for (const value of [
		{ ...registration, token: 'https://bad.example' },
		{ ...registration, permission: 'Denied' },
		{ ...registration, installationId: 'short' },
		{ ...registration, installationSecret: 'b' },
		{ ...registration, token: 'ExpoPushToken[' + 'a'.repeat(201) + ']' },
		{ ...registration, userId: 'other' },
	])
		assert.throws(() =>
			parsers.parseRegisterCommunityPushInstallationRequest(value),
		);
	assert.deepEqual(
		parsers.parseRegisterCommunityPushInstallationRequest({
			...registration,
			token: null,
			permission: 'Denied',
			deliveryEnabled: false,
		}).permission,
		'Denied',
	);
	assert.deepEqual(
		parsers.parseUnregisterCommunityPushInstallationRequest({
			installationId,
			installationSecret,
			operationId: 'remove1',
		}),
		{ installationId, installationSecret, operationId: 'remove1' },
	);
	assert.throws(() =>
		parsers.parseUnregisterCommunityPushInstallationRequest({
			installationId,
			installationSecret,
			operationId: 'remove1',
			userId: 'other',
		}),
	);
});

test('provider payload uses only a generic lock-screen message and recipient-bound identifier', () => {
	const payload = delivery.genericCommunityPushPayload(token, 'f'.repeat(64));
	assert.deepEqual(payload, {
		to: token,
		title: '77Faithful',
		body: 'You have a new community notification.',
		sound: 'default',
		data: { notificationId: 'f'.repeat(64) },
	});
	assert.equal(JSON.stringify(payload).includes('communityId'), false);
	assert.equal(JSON.stringify(payload).includes('actorUserId'), false);
	assert.equal(JSON.stringify(payload).includes('postId'), false);
});

test('HTTPS provider transport sends a bounded generic body with server secret and no token logging', async () => {
	const originalFetch = global.fetch;
	const originalLog = console.log;
	const originalError = console.error;
	const calls = [];
	const logs = [];
	global.fetch = async (url, options) => {
		calls.push({ url, options });
		return {
			status: 200,
			json: async () => ({ data: [{ status: 'ok', id: 'test-ticket' }] }),
		};
	};
	console.log = (...parts) => logs.push(parts);
	console.error = (...parts) => logs.push(parts);
	try {
		const payload = delivery.genericCommunityPushPayload(
			token,
			'f'.repeat(64),
		);
		const response = await delivery.expoPushTransport(
			'https://exp.host/--/api/v2/push/send',
			payload,
			'test-secret',
		);
		assert.equal(response.status, 200);
		assert.equal(calls.length, 1);
		assert.equal(calls[0].url, 'https://exp.host/--/api/v2/push/send');
		assert.equal(
			calls[0].options.headers.Authorization,
			'Bearer test-secret',
		);
		assert.deepEqual(JSON.parse(calls[0].options.body), payload);
		assert.equal(JSON.stringify(logs).includes(token), false);
		assert.equal(JSON.stringify(logs).includes('test-secret'), false);
		await assert.rejects(
			delivery.expoPushTransport(
				'https://bad.example/send',
				payload,
				'test-secret',
			),
		);
		assert.equal(calls.length, 1);
	} finally {
		global.fetch = originalFetch;
		console.log = originalLog;
		console.error = originalError;
	}
});
