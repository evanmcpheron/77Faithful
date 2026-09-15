const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
	parseListOwnCommunityContributionsRequest,
} = require('../functions/lib/generated/features/communities/community-post');
const contributions = require('../functions/lib/src/community/own-community-contributions');

test('owner contribution request is bounded and accepts no caller authority', () => {
	assert.deepEqual(parseListOwnCommunityContributionsRequest({}), {
		pageSize: 20,
	});
	assert.deepEqual(
		parseListOwnCommunityContributionsRequest({ pageSize: 50 }),
		{ pageSize: 50 },
	);
	for (const invalid of [
		{ userId: 'other' },
		{ communityId: 'alpha' },
		{ pageSize: 51 },
		{ pageSize: 0 },
		{ cursor: '!' },
		{ cursor: 'a'.repeat(513) },
	])
		assert.throws(() => parseListOwnCommunityContributionsRequest(invalid));
});

test('owner contribution callable requires a signed-in verified account', async () => {
	await assert.rejects(
		() =>
			contributions.listOwnCommunityContributions.run({
				data: {},
				auth: null,
			}),
		(error) => error.code === 'unauthenticated',
	);
	await assert.rejects(
		() =>
			contributions.listOwnCommunityContributions.run({
				data: {},
				auth: { uid: 'member', token: { email_verified: false } },
			}),
		(error) => error.code === 'permission-denied',
	);
});
