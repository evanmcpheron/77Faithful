import { parseOwnCommunityJourneyEnrollment } from './community-journey-detail.service';

jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('firebase/functions', () => ({
	getFunctions: jest.fn(),
	httpsCallable: jest.fn(),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'operation' }));

const stamp = { seconds: 1, nanoseconds: 0 };
const base = {
	communityJourneyEnrollmentId: 'schedule',
	communityId: 'group',
	communityJourneyId: 'schedule',
	groupDisplayStartDate: '2026-10-01',
	communityTimeZoneId: 'America/New_York',
	startingTimeZoneId: 'America/Chicago',
	communityCalendarDate: '2026-10-01',
	startingZoneCalendarDate: '2026-09-30',
	personalStartDateBehavior: 'ParticipantCalendarDay1',
	activationEligibility: 'Eligible',
	enrolledAt: stamp,
};

it.each([
	{ status: 'Enrolled' },
	{ status: 'Started', journeyId: 'private-journey', startedAt: stamp },
	{ status: 'Withdrawn', withdrawnAt: stamp },
	{
		status: 'StartBlocked',
		reason: 'ActivePersonalJourney',
		blockedAt: stamp,
	},
])('validates only the caller enrollment lifecycle %s', (lifecycle) => {
	const result = parseOwnCommunityJourneyEnrollment({
		enrollment: { ...base, lifecycle },
	});
	expect(result.enrollment?.lifecycle).toEqual(lifecycle);
});

it('accepts the safe empty state', () => {
	expect(parseOwnCommunityJourneyEnrollment({ enrollment: null })).toEqual({
		enrollment: null,
	});
});

it('rejects leaked private fields and mismatched response shapes', () => {
	expect(() =>
		parseOwnCommunityJourneyEnrollment({
			enrollment: {
				...base,
				lifecycle: { status: 'Enrolled' },
				optionalPracticeIds: ['pray'],
			},
		}),
	).toThrow();
	expect(() =>
		parseOwnCommunityJourneyEnrollment({
			enrollment: {
				...base,
				lifecycle: {
					status: 'Started',
					journeyId: '../other',
					startedAt: stamp,
				},
			},
		}),
	).toThrow();
});
