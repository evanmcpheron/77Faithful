const assert = require('node:assert/strict');
const { test } = require('node:test');
const contract = require('../functions/lib/generated/features/communities/community-journey');

const enrollment = {
	communityId: 'alpha',
	communityJourneyId: 'schedule-1',
	expectedCommunityJourneyRevision: 2,
	setupDraftId: 'current',
	expectedSetupRevision: 4,
	startingTimeZoneId: 'America/Los_Angeles',
	consentToScheduledActivation: true,
	operationId: 'enroll-1',
};

test('enrollment requires bounded current setup, confirmed IANA zone, and explicit activation consent', () => {
	assert.deepEqual(
		contract.parseEnrollCommunityJourneyRequest(enrollment),
		enrollment,
	);
	for (const invalid of [
		{ consentToScheduledActivation: false },
		{ consentToScheduledActivation: undefined },
		{ startingTimeZoneId: '+07:00' },
		{ startingTimeZoneId: 'Mars/Olympus' },
		{ startingTimeZoneId: 'A'.repeat(101) },
		{ setupDraftId: 'other' },
		{ expectedSetupRevision: -1 },
		{ expectedCommunityJourneyRevision: 2.5 },
		{ optionalPracticeIds: ['Movement', 'Gratitude'] },
		{ motivation: 'private body' },
		{ operationId: 'x'.repeat(129) },
	])
		assert.throws(() =>
			contract.parseEnrollCommunityJourneyRequest({
				...enrollment,
				...invalid,
			}),
		);
});

test('withdrawal and private reader reject caller identity and unexpected fields', () => {
	const withdrawal = {
		communityId: 'alpha',
		communityJourneyId: 'schedule-1',
		operationId: 'withdraw-1',
	};
	const reader = { communityId: 'alpha', communityJourneyId: 'schedule-1' };
	assert.deepEqual(
		contract.parseWithdrawCommunityJourneyEnrollmentRequest(withdrawal),
		withdrawal,
	);
	assert.deepEqual(
		contract.parseGetCommunityJourneyEnrollmentRequest(reader),
		reader,
	);
	for (const invalid of [
		{ ...withdrawal, userId: 'other' },
		{ ...withdrawal, operationId: '' },
		{ ...reader, organizerId: 'owner' },
		{ ...reader, communityJourneyId: 'x/y' },
	])
		assert.throws(() =>
			'operationId' in invalid
				? contract.parseWithdrawCommunityJourneyEnrollmentRequest(
						invalid,
					)
				: contract.parseGetCommunityJourneyEnrollmentRequest(invalid),
		);
});

test('each enrollment callable requires authenticated, verified account identity', async () => {
	const callables = require('../functions/lib/src/community/community-journey-enrollment');
	for (const [callable, data] of [
		[callables.enrollCommunityJourney, enrollment],
		[
			callables.getCommunityJourneyEnrollment,
			{ communityId: 'alpha', communityJourneyId: 'schedule-1' },
		],
		[
			callables.withdrawCommunityJourneyEnrollment,
			{
				communityId: 'alpha',
				communityJourneyId: 'schedule-1',
				operationId: 'withdraw-1',
			},
		],
	]) {
		await assert.rejects(
			callable.run({ data }),
			(caught) => caught.code === 'unauthenticated',
		);
		await assert.rejects(
			callable.run({
				data,
				auth: { uid: 'member', token: { email_verified: false } },
			}),
			(caught) => caught.code === 'permission-denied',
		);
	}
});
