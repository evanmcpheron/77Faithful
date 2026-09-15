const assert = require('node:assert/strict');
const { test } = require('node:test');
const contract = require('../functions/lib/generated/features/communities/community-progress');
const progress = require('../functions/lib/src/community/community-progress');

const request = {
	communityId: 'alpha',
	communityJourneyId: 'journey1',
	shouldShareIndividualProgress: true,
	shouldContributeToAggregateProgress: false,
	operationId: 'set1',
};

test('progress parsers bound IDs, flags, page size and reject unexpected fields', () => {
	assert.deepEqual(
		contract.parseSetCommunityProgressSharingRequest(request),
		request,
	);
	for (const invalid of [
		{ communityId: 'a'.repeat(129) },
		{ communityJourneyId: 'bad/path' },
		{ operationId: '' },
		{ shouldShareIndividualProgress: 1 },
		{ shouldContributeToAggregateProgress: 'false' },
		{ userId: 'owner' },
	])
		assert.throws(() =>
			contract.parseSetCommunityProgressSharingRequest({
				...request,
				...invalid,
			}),
		);
	for (const invalid of [
		{ pageSize: 0 },
		{ pageSize: 51 },
		{ pageSize: 1.5 },
		{ cursor: '' },
		{ cursor: 'a'.repeat(513) },
		{ cursor: 'bad=' },
		{ preference: true },
	])
		assert.throws(() =>
			contract.parseListSharedCommunityProgressRequest({
				communityId: 'alpha',
				communityJourneyId: 'journey1',
				...invalid,
			}),
		);
	assert.throws(() =>
		contract.parseGetCommunityAggregateProgressRequest({
			communityId: 'alpha',
			communityJourneyId: 'journey1',
			memberId: 'owner',
		}),
	);
});

test('callable identity requires authentication and verified email', () => {
	assert.throws(
		() => progress.requireCommunityProgressAccount(undefined),
		(error) => error.details?.reason === 'AuthenticationRequired',
	);
	assert.throws(
		() =>
			progress.requireCommunityProgressAccount({
				uid: 'owner',
				token: { email_verified: false },
			}),
		(error) => error.details?.reason === 'EmailVerificationRequired',
	);
	assert.equal(
		progress.requireCommunityProgressAccount({
			uid: 'owner',
			token: { email_verified: true },
		}),
		'owner',
	);
});
