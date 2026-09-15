const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createRequire } = require('node:module');
const functionsRequire = createRequire(
	require.resolve('../functions/package.json'),
);
const activation = require('../functions/lib/src/community/activate-community-journey-enrollments');
const { retryCommunityJourneyActivation } = activation;

test('activation retry uses the canonical bounded exact-field contract', () => {
	const input = {
		communityId: 'alpha',
		communityJourneyId: 'journey',
		operationId: 'retry-1',
	};
	assert.deepEqual(
		activation.parseRetryCommunityJourneyActivationRequest(input),
		input,
	);
	for (const invalid of [
		{ ...input, userId: 'other' },
		{ ...input, operationId: '../escape' },
		{ ...input, communityJourneyId: 'x'.repeat(129) },
		{ ...input, operationId: null },
	]) {
		assert.throws(
			() =>
				activation.parseRetryCommunityJourneyActivationRequest(invalid),
			(caught) => caught.details?.reason === 'InvalidInput',
		);
	}
});

test('activation retry callable requires authenticated verified identity before touching enrollment', async () => {
	const input = {
		communityId: 'alpha',
		communityJourneyId: 'journey',
		operationId: 'retry-1',
	};
	await assert.rejects(
		retryCommunityJourneyActivation.run({ data: input }),
		(caught) => caught.details?.reason === 'AuthenticationRequired',
	);
	await assert.rejects(
		retryCommunityJourneyActivation.run({
			data: input,
			auth: { uid: 'member', token: { email_verified: false } },
		}),
		(caught) => caught.details?.reason === 'EmailVerificationRequired',
	);
});

test('activation calendar uses calendar dates across participant and community zones', () => {
	const {
		getJourneyCalendarDate,
		addJourneyCalendarDays,
	} = require('../functions/lib/generated/features/journey/journey-calendar');
	const instant = new Date(Date.UTC(2026, 10, 1, 6));
	assert.equal(
		getJourneyCalendarDate(instant, 'America/New_York'),
		'2026-11-01',
	);
	assert.equal(
		getJourneyCalendarDate(instant, 'America/Los_Angeles'),
		'2026-10-31',
	);
	assert.equal(addJourneyCalendarDays('2026-11-01', 77), '2027-01-17');
});
