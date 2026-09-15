import { parseCommunityCalendarDate } from './community-journey';
import {
	cancelCommunityJourney,
	communityJourneyReason,
	configureCommunityJourney,
	getCommunityJourneyCourseOption,
	getCommunityJourneySchedule,
	reviseCommunityJourney,
} from './community-journey-schedule.service';

const mockCall = jest.fn();
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('firebase/functions', () => ({
	getFunctions: () => 'functions',
	httpsCallable: (_functions: unknown, name: string) => (request: unknown) =>
		mockCall(name, request),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'new-operation' }));
const preview = {
	communityJourneyId: 'schedule',
	communityId: 'group',
	revision: 1,
	course: { courseId: 'course', courseVersionId: 'version' },
	startDate: '2026-10-01',
	timeZoneId: 'America/New_York',
	status: 'Scheduled',
	canEnroll: true,
	canRevise: true,
};
beforeEach(() => mockCall.mockReset());
it('uses the server course option and accepts an empty option without inventing a course', async () => {
	mockCall
		.mockResolvedValueOnce({ data: { course: preview.course } })
		.mockResolvedValueOnce({ data: { course: null } });
	await expect(getCommunityJourneyCourseOption('group')).resolves.toEqual({
		course: preview.course,
	});
	await expect(getCommunityJourneyCourseOption('group')).resolves.toEqual({
		course: null,
	});
	expect(mockCall).toHaveBeenCalledWith('getCommunityJourneyCourseOption', {
		communityId: 'group',
	});
});
it('creates a coordinated schedule only from a validated backend confirmation', async () => {
	mockCall.mockResolvedValue({ data: { communityJourney: preview } });
	const request = {
		communityId: 'group',
		course: preview.course,
		startDate: parseCommunityCalendarDate(preview.startDate),
		timeZoneId: preview.timeZoneId,
		operationId: 'operation',
	};
	await expect(configureCommunityJourney(request)).resolves.toEqual({
		communityJourney: preview,
	});
	expect(mockCall).toHaveBeenCalledWith('configureCommunityJourney', request);
	expect(JSON.stringify(mockCall.mock.calls)).not.toMatch(
		/setupDraftId|enrollCommunityJourney|startJourney/,
	);
});
it('rejects malformed and private schedule responses', async () => {
	mockCall.mockResolvedValueOnce({
		data: { communityJourney: { ...preview, privateWriting: 'secret' } },
	});
	await expect(getCommunityJourneySchedule('group')).rejects.toThrow();
	mockCall.mockResolvedValueOnce({ data: { communityJourney: null } });
	await expect(getCommunityJourneySchedule('group')).resolves.toEqual({
		communityJourney: null,
	});
});
it('passes revision and operation ID to revise and cancel and exposes conflict reasons', async () => {
	mockCall
		.mockResolvedValueOnce({ data: { communityJourney: preview } })
		.mockResolvedValueOnce({
			data: {
				communityJourney: {
					...preview,
					status: 'Canceled',
					canEnroll: false,
					canRevise: false,
				},
			},
		});
	const fields = {
		communityId: 'group',
		course: preview.course,
		startDate: parseCommunityCalendarDate(preview.startDate),
		timeZoneId: preview.timeZoneId,
		operationId: 'operation',
	};
	await reviseCommunityJourney({
		...fields,
		communityJourneyId: 'schedule',
		expectedRevision: 1,
	});
	await cancelCommunityJourney({
		communityId: 'group',
		communityJourneyId: 'schedule',
		expectedRevision: 1,
		operationId: 'operation',
	});
	expect(mockCall.mock.calls.map(([name]) => name)).toEqual([
		'reviseCommunityJourney',
		'cancelCommunityJourney',
	]);
	expect(
		communityJourneyReason({ details: { reason: 'RevisionConflict' } }),
	).toBe('RevisionConflict');
	expect(
		communityJourneyReason({ details: { reason: 'OrganizerRequired' } }),
	).toBe('OrganizerRequired');
	expect(
		communityJourneyReason({ details: { reason: 'CommunityClosed' } }),
	).toBe('CommunityClosed');
});
