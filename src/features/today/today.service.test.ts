import type { IJourneyDaySession } from '@td/features/journey/journey-day-session.types';
import type { IJourneyDetails } from '@td/types/journey/journey.types';
import { getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
	clearDaySessions,
	setDaySessionAccount,
} from '../journey/journey-day-cache';
import { loadPracticeDay } from '../journey/journey-practice.service';
import { getTodayPractices } from './today-practices';
import {
	getCachedToday,
	loadToday,
	saveTodayCompletion,
} from './today.service';

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
		docs: [
			{
				id: 'journey',
				data: () => ({
					startDate,
					userId: 'owner',
					state: { status: 'Active' },
				}),
			},
		],
	} as never);
beforeEach(() => {
	setDaySessionAccount('owner');
	clearDaySessions();
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
	setDaySessionAccount('other');
	await expect(loadToday('other', new Date(2026, 8, 10, 12))).rejects.toThrow(
		'Unexpected active journey',
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
	callable.mockResolvedValueOnce({
		data: {
			journeyId: 'journey',
			dayNumber: 1,
			practiceId: 'Worship',
			completion: { status: 'NotMarked', revision: 4, updatedAt: null },
		},
	});
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

it('shares a getJourneyDay request between Today and a practice screen', async () => {
	let resolve!: (value: { data: IJourneyDaySession }) => void;
	callable.mockImplementationOnce(
		() =>
			new Promise((done) => {
				resolve = done;
			}),
	);
	const practice = loadPracticeDay('owner', 'journey', 1);
	const today = loadToday('owner', new Date(2026, 8, 10, 12));
	await Promise.resolve();
	resolve({ data: session() });
	const [practiceSession, todayResult] = await Promise.all([practice, today]);
	expect(callable).toHaveBeenCalledTimes(1);
	expect(todayResult.status === 'Ready' && todayResult.session).toBe(
		practiceSession,
	);
});

it('applies a confirmed practice result to Today without another day load', async () => {
	await loadToday('owner', new Date(2026, 8, 10, 12));
	const result = {
		journeyId: 'journey',
		dayNumber: 1,
		practiceId: 'Pray',
		completion: { status: 'Complete', revision: 1, updatedAt: null },
	};
	callable.mockResolvedValueOnce({ data: result });
	await saveTodayCompletion({
		journeyId: 'journey',
		dayNumber: 1,
		practiceId: 'Pray',
		isComplete: true,
		expectedCompletionRevision: 0,
	});
	expect(getCachedToday('owner')?.session.day.practices.pray).toEqual(
		result.completion,
	);
	expect(callable).toHaveBeenCalledTimes(2);
});

const resolvedJourney = () =>
	({
		journeyId: 'journey',
		journey: {
			userId: 'owner',
			startDate: '2026-09-10',
			state: { status: 'Active' },
		},
	}) as unknown as Pick<IJourneyDetails, 'journeyId' | 'journey'>;
it('uses provider-resolved journey data without an extra active-journey query', async () => {
	const result = await loadToday(
		'owner',
		new Date(2026, 8, 10, 12),
		false,
		resolvedJourney(),
	);
	expect(result.status).toBe('Ready');
	expect(getDocs).not.toHaveBeenCalled();
	expect(callable).toHaveBeenCalledTimes(1);
});
it('respects resolved active-journey absence without querying or requesting a day', async () => {
	expect(await loadToday('owner', new Date(), false, null)).toEqual({
		status: 'NoActiveJourney',
	});
	expect(getDocs).not.toHaveBeenCalled();
	expect(callable).not.toHaveBeenCalled();
});
it('rejects a resolved journey from another account or a terminal journey', async () => {
	const resolved = resolvedJourney();
	await expect(
		loadToday('other', new Date(), false, resolved),
	).rejects.toThrow('Unexpected active journey');
	await expect(
		loadToday('owner', new Date(), false, {
			...resolved,
			journey: {
				...resolved.journey,
				state: {
					status: 'Completed',
					completedAt: { seconds: 1, nanoseconds: 0 },
				},
			},
		}),
	).rejects.toThrow('Unexpected active journey');
	expect(getDocs).not.toHaveBeenCalled();
	expect(callable).not.toHaveBeenCalled();
});
