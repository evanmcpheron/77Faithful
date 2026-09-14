import {
	cachePracticeCompletion,
	clearDaySessions,
	getCachedDaySession,
	getDaySessionGeneration,
	loadDaySession,
	setDaySessionAccount,
} from './journey-day-cache';
import type {
	IGetJourneyDayRequest,
	IJourneyDaySession,
} from './journey-day-session.types';

const request: IGetJourneyDayRequest = {
	journeyId: 'journey',
	dayNumber: 1,
	observedPhoneTimeZoneId: 'UTC',
};
const session = (): IJourneyDaySession =>
	({
		day: {
			userId: 'owner',
			journeyId: 'journey',
			dayNumber: 1,
			practices: {
				readScripture: {
					status: 'NotMarked',
					revision: 0,
					updatedAt: null,
				},
				pray: { status: 'NotMarked', revision: 0, updatedAt: null },
				reflect: { status: 'NotMarked', revision: 0, updatedAt: null },
				optionalPractices: [
					{
						practiceId: 'Worship',
						completion: {
							status: 'NotMarked',
							revision: 0,
							updatedAt: null,
						},
					},
					{
						practiceId: 'Gratitude',
						completion: {
							status: 'NotMarked',
							revision: 0,
							updatedAt: null,
						},
					},
				],
			},
		},
	}) as unknown as IJourneyDaySession;
const deferred = () => {
	let resolve!: (value: IJourneyDaySession) => void;
	const promise = new Promise<IJourneyDaySession>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};
beforeEach(() => {
	jest.useFakeTimers();
	jest.setSystemTime(new Date('2026-09-14T12:00:00Z'));
	setDaySessionAccount('owner');
	clearDaySessions();
});
afterEach(() => jest.useRealTimers());
it('deduplicates simultaneous requests and reuses a fresh session', async () => {
	const pending = deferred();
	const fetch = jest.fn(() => pending.promise);
	const first = loadDaySession('owner', request, fetch);
	const second = loadDaySession('owner', request, fetch);
	expect(second).toBe(first);
	pending.resolve(session());
	await first;
	await loadDaySession('owner', request, fetch);
	expect(fetch).toHaveBeenCalledTimes(1);
});
it('keeps stale data readable during a deduplicated background refresh', async () => {
	const initial = session();
	await loadDaySession('owner', request, async () => initial);
	jest.advanceTimersByTime(30_001);
	const pending = deferred();
	const fetch = jest.fn(() => pending.promise);
	const refresh = loadDaySession('owner', request, fetch);
	expect(getCachedDaySession('owner', request)).toBe(initial);
	expect(loadDaySession('owner', request, fetch)).toBe(refresh);
	const updated = session();
	pending.resolve(updated);
	await refresh;
	expect(getCachedDaySession('owner', request)).toBe(updated);
});
it.each(['account', 'sign-out', 'translation/journey'] as const)(
	'discards pending requests after %s invalidation',
	async (change) => {
		const pending = deferred();
		const first = loadDaySession('owner', request, () => pending.promise);
		if (change === 'account') setDaySessionAccount('other');
		else if (change === 'sign-out') {
			setDaySessionAccount(null);
			setDaySessionAccount('owner');
		} else clearDaySessions();
		pending.resolve(session());
		await expect(first).rejects.toThrow('Day session changed');
		expect(getCachedDaySession('owner', request)).toBeNull();
	},
);
it('never reads or requests another account’s cached content', async () => {
	await loadDaySession('owner', request, async () => session());
	const fetch = jest.fn();
	expect(getCachedDaySession('other', request)).toBeNull();
	await expect(loadDaySession('other', request, fetch)).rejects.toThrow(
		'Account changed',
	);
	expect(fetch).not.toHaveBeenCalled();
});
it('keys by journey, day, time zone and current calendar date', async () => {
	await loadDaySession('owner', request, async () => session());
	for (const changed of [
		{ ...request, journeyId: 'other' },
		{ ...request, dayNumber: 2 },
		{ ...request, observedPhoneTimeZoneId: 'America/New_York' },
	])
		expect(getCachedDaySession('owner', changed)).toBeNull();
	jest.advanceTimersByTime(86_400_000);
	expect(getCachedDaySession('owner', request)).toBeNull();
});
it('preserves confirmed completion against an older refresh and ignores older saves', async () => {
	await loadDaySession('owner', request, async () => session());
	const pending = deferred();
	const refresh = loadDaySession(
		'owner',
		request,
		() => pending.promise,
		true,
	);
	const result = {
		journeyId: 'journey',
		dayNumber: 1,
		practiceId: 'Worship',
		completion: { status: 'Complete', revision: 2, updatedAt: null },
	} as const;
	cachePracticeCompletion('owner', getDaySessionGeneration(), result);
	cachePracticeCompletion('owner', getDaySessionGeneration(), {
		...result,
		completion: { status: 'NotMarked', revision: 1, updatedAt: null },
	});
	pending.resolve(session());
	await refresh;
	const day = getCachedDaySession('owner', request)?.day;
	expect(day?.practices.optionalPractices[0].completion).toEqual(
		result.completion,
	);
	expect(day?.practices.pray.status).toBe('NotMarked');
});
it('ignores a confirmed save from a previous account session', async () => {
	const oldGeneration = getDaySessionGeneration();
	setDaySessionAccount(null);
	setDaySessionAccount('owner');
	await loadDaySession('owner', request, async () => session());
	cachePracticeCompletion('owner', oldGeneration, {
		journeyId: 'journey',
		dayNumber: 1,
		practiceId: 'Pray',
		completion: { status: 'Complete', revision: 2, updatedAt: null },
	});
	expect(
		getCachedDaySession('owner', request)?.day.practices.pray.status,
	).toBe('NotMarked');
});
it('evicts a rejected refresh and permits a retry through server validation', async () => {
	await loadDaySession('owner', request, async () => session());
	await expect(
		loadDaySession(
			'owner',
			request,
			async () => {
				throw new Error('not-found');
			},
			true,
		),
	).rejects.toThrow('not-found');
	expect(getCachedDaySession('owner', request)).toBeNull();
	await loadDaySession('owner', request, async () => session());
	expect(getCachedDaySession('owner', request)).not.toBeNull();
});
it('rejects mismatched server responses', async () => {
	const invalid = session();
	const response = { ...invalid, day: { ...invalid.day, userId: 'other' } };
	await expect(
		loadDaySession('owner', request, async () => response),
	).rejects.toThrow('Unexpected journey day');
	expect(getCachedDaySession('owner', request)).toBeNull();
});
