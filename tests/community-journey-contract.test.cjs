const assert = require('node:assert/strict');
const { test } = require('node:test');
const contract = require('../functions/lib/generated/features/communities/community-journey');
const calendar = require('../functions/lib/generated/features/journey/journey-calendar');
const valid = {
	communityId: 'alpha',
	course: { courseId: 'course', courseVersionId: 'v1' },
	startDate: '2026-11-01',
	timeZoneId: 'America/New_York',
	operationId: 'schedule-1',
};
test('schedule contracts reject malformed calendar, offset zones, extra fields, and unbounded input', () => {
	assert.deepEqual(
		contract.parseConfigureCommunityJourneyRequest(valid),
		valid,
	);
	for (const invalid of [
		{ startDate: '2026-02-30' },
		{ startDate: '2026-13-01' },
		{ timeZoneId: '+05:00' },
		{ timeZoneId: 'Mars/Olympus' },
		{ timeZoneId: 'A'.repeat(101) },
		{ currentDay: 1 },
		{ course: { ...valid.course, publicationState: 'Published' } },
		{ operationId: 'a'.repeat(129) },
	])
		assert.throws(() =>
			contract.parseConfigureCommunityJourneyRequest({
				...valid,
				...invalid,
			}),
		);
	assert.throws(() =>
		contract.parseListCommunityJourneyHistoryRequest({
			communityId: 'alpha',
			pageSize: 21,
		}),
	);
	assert.throws(() =>
		contract.parseListCommunityJourneyHistoryRequest({
			communityId: 'alpha',
			participantCount: 7,
		}),
	);
});
test('named community calendar date crosses DST and year/month boundaries', () => {
	for (const [instant, expected] of [
		['2026-11-01T03:59:59Z', '2026-10-31'],
		['2026-11-01T04:00:00Z', '2026-11-01'],
		['2027-01-01T04:59:59Z', '2026-12-31'],
		['2027-01-01T05:00:00Z', '2027-01-01'],
		['2026-03-01T04:59:59Z', '2026-02-28'],
	])
		assert.equal(
			calendar.getJourneyCalendarDate(
				new Date(instant),
				'America/New_York',
			),
			expected,
		);
});
