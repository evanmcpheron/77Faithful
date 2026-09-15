const assert = require('node:assert/strict');
const { test } = require('node:test');

test('client cannot read or write notification event, inbox, preference, or retry records', async (t) => {
	if (
		!process.env.FIRESTORE_EMULATOR_HOST ||
		!process.env.FIREBASE_AUTH_EMULATOR_HOST
	)
		return t.skip('Firestore/Auth emulators unavailable');
	const projectId = 'demo-faithful-notification-rules';
	const signup = await fetch(
		`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'notification-owner@example.test',
				password: 'local-test-password',
				returnSecureToken: true,
			}),
		},
	);
	assert.equal(signup.ok, true, await signup.text());
	const { idToken, localId } = await signup.json();
	const paths = [
		'communityNotificationEvents/event',
		`users/${localId}/communityNotifications/event`,
		`users/${localId}/communityNotificationReadOperations/retry`,
		`users/${localId}/communityNotificationPreferences/church`,
		`users/${localId}/communityNotificationPreferenceOperations/retry`,
	];
	for (const documentPath of paths) {
		const url = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${projectId}/databases/(default)/documents/${documentPath}`;
		for (const method of ['GET', 'PATCH']) {
			const response = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${idToken}`,
					'Content-Type': 'application/json',
				},
				...(method === 'PATCH'
					? {
							body: JSON.stringify({
								fields: { sample: { stringValue: 'Changed' } },
							}),
						}
					: {}),
			});
			assert.equal(
				response.status,
				403,
				`${method} ${documentPath}: ${await response.text()}`,
			);
		}
	}
});
