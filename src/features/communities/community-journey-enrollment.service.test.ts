import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	enrollInCommunityJourney,
	parseEnrollmentConfirmation,
} from './community-journey-enrollment.service';

jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('firebase/functions', () => ({
	getFunctions: jest.fn(),
	httpsCallable: jest.fn(),
}));

const preview = {
	communityJourneyId: 'schedule-1',
	communityId: 'community-1',
	revision: 3,
	course: { courseId: 'course-1', courseVersionId: 'version-1' },
	startDate: '2026-10-01',
	timeZoneId: 'America/New_York',
	status: 'Scheduled',
	canEnroll: true,
	canRevise: false,
};
const confirmation = {
	communityJourneyEnrollmentId: 'schedule-1',
	communityJourney: preview,
	enrolledAt: { seconds: 1, nanoseconds: 0 },
	startingTimeZoneId: 'America/Chicago',
	groupDisplayStartDate: '2026-10-01',
	personalStartDateBehavior: 'ParticipantCalendarDay1',
};

it('submits the canonical revisions, consent, and operation ID to the trusted callable', async () => {
	const invoke = Object.assign(
		jest.fn().mockResolvedValue({ data: confirmation }),
		{ stream: jest.fn() },
	);
	jest.mocked(getFunctions).mockReturnValue(
		{} as ReturnType<typeof getFunctions>,
	);
	jest.mocked(httpsCallable).mockReturnValue(invoke);
	const request = {
		communityId: 'community-1',
		communityJourneyId: 'schedule-1',
		expectedCommunityJourneyRevision: 3,
		setupDraftId: 'current' as const,
		expectedSetupRevision: 8,
		startingTimeZoneId: 'America/Chicago',
		consentToScheduledActivation: true as const,
		operationId: 'operation-1',
	};
	const result = await enrollInCommunityJourney(request);
	expect(httpsCallable).toHaveBeenCalledWith(
		expect.anything(),
		'enrollCommunityJourney',
	);
	expect(invoke).toHaveBeenCalledWith(request);
	expect(result.communityJourneyEnrollmentId).toBe('schedule-1');
	expect(result.personalStartDateBehavior).toBe('ParticipantCalendarDay1');
	expect(result).not.toHaveProperty('journeyId');
});

it('rejects malformed confirmation and fake private journey fields', () => {
	expect(() =>
		parseEnrollmentConfirmation({
			...confirmation,
			journeyId: 'future-journey',
		}),
	).toThrow();
	expect(() =>
		parseEnrollmentConfirmation({
			...confirmation,
			enrolledAt: { seconds: 1, nanoseconds: -1 },
		}),
	).toThrow();
});
