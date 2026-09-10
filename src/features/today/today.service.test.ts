import type { IJourneyDaySession } from '@td/features/journey/journey-day-session.types';
import { getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getTodayPractices } from './today-practices';
import { loadToday, saveTodayCompletion } from './today.service';

jest.mock('@td/services/firebase/firebase.instance', () => ({
	app: {},
	db: {},
}));
jest.mock('@td/features/account/device-id.service', () => ({
	getDeviceId: async () => 'device',
}));
jest.mock('firebase/firestore', () => ({
	collection: jest.fn(),
	doc: () => ({ id: 'operation' }),
	getDocs: jest.fn(),
	query: jest.fn(),
	where: jest.fn(),
	limit: jest.fn(),
	Timestamp: { now: () => ({ seconds: 100, nanoseconds: 0 }) },
}));
jest.mock('firebase/functions', () => ({
	getFunctions: jest.fn(),
	httpsCallable: jest.fn(),
}));
const callable = Object.assign(jest.fn(), { stream: jest.fn() });
const unmarked = { status: 'NotMarked', revision: 0, updatedAt: null } as const;
const session = (dayNumber = 1): IJourneyDaySession =>
	({
		day: {
			userId: 'owner',
			journeyId: 'journey',
			dayNumber,
			practices: {
				readScripture: unmarked,
				pray: unmarked,
				reflect: unmarked,
				optionalPractices: [
					{ practiceId: 'Gratitude', completion: unmarked },
					{
						practiceId: 'Worship',
						completion: {
							...unmarked,
							status: 'Complete',
							revision: 1,
						},
					},
				],
			},
		},
		content: {
			prayerPrompt: 'Today’s prayer',
			reflectionQuestion: 'Today’s question',
		},
		scriptureReference: 'John 1:1–5',
	}) as unknown as IJourneyDaySession;
const journey = (startDate: string) =>
	jest.mocked(getDocs).mockResolvedValue({
		docs: [{ id: 'journey', data: () => ({ startDate }) }],
	} as never);
beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(httpsCallable).mockReturnValue(callable);
	callable.mockResolvedValue({ data: session() });
	journey('2026-09-10');
});
it('loads Day 1 for a journey started on the phone’s current calendar date', async () => {
	const instant = new Date(2026, 8, 10, 12);
	expect((await loadToday('owner', instant)).status).toBe('Ready');
	expect(callable).toHaveBeenCalledWith({
		journeyId: 'journey',
		dayNumber: 1,
		observedPhoneTimeZoneId:
			Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
});
it('advances by calendar dates even when no practices were completed', async () => {
	callable.mockResolvedValue({ data: session(12) });
	await loadToday('owner', new Date(2026, 8, 21, 12));
	expect(callable.mock.calls[0][0].dayNumber).toBe(12);
});
it('does not show Day 78 or request future content after the journey ends', async () => {
	expect(await loadToday('owner', new Date(2026, 10, 26, 12))).toEqual({
		status: 'Completed',
	});
	expect(callable).not.toHaveBeenCalled();
});
it('does not fabricate Day 1 before the start date in the current zone', async () => {
	expect(await loadToday('owner', new Date(2026, 8, 9, 12))).toEqual({
		status: 'NotStarted',
	});
	expect(callable).not.toHaveBeenCalled();
});
it('does not fall back to sample data for an absent journey', async () => {
	jest.mocked(getDocs).mockResolvedValue({ docs: [] } as never);
	expect(await loadToday('owner')).toEqual({ status: 'NoActiveJourney' });
	expect(callable).not.toHaveBeenCalled();
});
it('rejects a response belonging to another account', async () => {
	await expect(loadToday('other', new Date(2026, 8, 10, 12))).rejects.toThrow(
		'Unexpected journey day',
	);
});
it('shows foundational practices followed by the actual assignments and saved completion', () => {
	const practices = getTodayPractices(session());
	expect(practices.map((practice) => practice.id)).toEqual([
		'ReadScripture',
		'Pray',
		'Reflect',
		'Gratitude',
		'Worship',
	]);
	expect(
		practices.filter(
			(practice) => practice.completion.status === 'Complete',
		),
	).toHaveLength(1);
	expect(practices[0]?.description).toBe('John 1:1–5');
	expect(practices[1]?.description).toBe('Today’s prayer');
});
it('sends completion through the trusted function with the assigned practice and expected revision', async () => {
	await saveTodayCompletion({
		journeyId: 'journey',
		dayNumber: 1,
		practiceId: 'Worship',
		isComplete: false,
		expectedCompletionRevision: 3,
	});
	expect(httpsCallable).toHaveBeenCalledWith(
		undefined,
		'setJourneyPracticeCompletion',
	);
	expect(callable).toHaveBeenCalledWith(
		expect.objectContaining({
			practiceId: 'Worship',
			isComplete: false,
			expectedCompletionRevision: 3,
			origin: {
				operationId: 'operation',
				deviceId: 'device',
				recordedOnDeviceAt: { seconds: 100, nanoseconds: 0 },
			},
		}),
	);
});
