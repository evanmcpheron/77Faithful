import type { ISetPracticeCompletionResult } from '@td/types/journey/journey-day.types';
import { getJourneyCalendarDate } from './journey-calendar';
import type {
	IGetJourneyDayRequest,
	IJourneyDaySession,
} from './journey-day-session.types';

const sessions = new Map<
	string,
	{ session: IJourneyDaySession; loadedAt: number }
>();
const pending = new Map<string, Promise<IJourneyDaySession>>();
const listeners = new Set<() => void>();
let accountId: string | null = null;
let generation = 0;
let revision = 0;
const notify = () => {
	revision++;
	listeners.forEach((listener) => listener());
};
export const subscribeDaySessions = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};
export const getDaySessionRevision = () => revision;
export const getDaySessionGeneration = () => generation;
export const getDaySessionAccount = () => accountId;
export const clearDaySessions = () => {
	generation++;
	sessions.clear();
	pending.clear();
	notify();
};
export const setDaySessionAccount = (userId: string | null) => {
	if (accountId === userId) return;
	accountId = userId;
	clearDaySessions();
};
export const getDaySessionCalendar = () => {
	const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	return `${getJourneyCalendarDate(new Date(), zone)}:${zone}`;
};
const keyFor = (userId: string, request: IGetJourneyDayRequest) =>
	JSON.stringify([
		userId,
		request.journeyId,
		request.dayNumber,
		request.observedPhoneTimeZoneId,
		getDaySessionCalendar(),
	]);
export const getCachedDaySession = (
	userId: string,
	request: IGetJourneyDayRequest,
) =>
	userId === accountId
		? (sessions.get(keyFor(userId, request))?.session ?? null)
		: null;

export const loadDaySession = (
	userId: string,
	request: IGetJourneyDayRequest,
	fetchSession: () => Promise<IJourneyDaySession>,
	force = false,
): Promise<IJourneyDaySession> => {
	if (userId !== accountId)
		return Promise.reject(new Error('Account changed.'));
	const key = keyFor(userId, request);
	const cached = sessions.get(key);
	const inFlight = pending.get(key);
	if (inFlight) return inFlight;
	if (
		!force &&
		cached &&
		Date.now() >= cached.loadedAt &&
		Date.now() - cached.loadedAt < 30_000
	)
		return Promise.resolve(cached.session);
	const startedGeneration = generation;
	const promise = fetchSession()
		.then((session) => {
			if (
				generation !== startedGeneration ||
				keyFor(userId, request) !== key
			)
				throw new Error('Day session changed.');
			if (
				session.day.userId !== userId ||
				session.day.journeyId !== request.journeyId ||
				session.day.dayNumber !== request.dayNumber
			)
				throw new Error('Unexpected journey day.');
			// A refresh begun before a confirmed completion must not roll it back.
			const current = sessions.get(key)?.session;
			if (current) {
				for (const result of completionResults(current))
					applyCompletion(session, result);
			}
			sessions.set(key, { session, loadedAt: Date.now() });
			if (sessions.size > 8) {
				const oldest = sessions.keys().next().value;
				if (oldest) sessions.delete(oldest);
			}
			notify();
			return session;
		})
		.catch((error: unknown) => {
			// Do not keep displaying content rejected by the trusted endpoint.
			if (generation === startedGeneration) {
				sessions.delete(key);
				notify();
			}
			throw error;
		})
		.finally(() => {
			if (pending.get(key) === promise) pending.delete(key);
		});
	pending.set(key, promise);
	return promise;
};

const completionResults = ({
	day,
}: IJourneyDaySession): ISetPracticeCompletionResult[] =>
	[
		{
			practiceId: 'ReadScripture' as const,
			completion: day.practices.readScripture,
		},
		{ practiceId: 'Pray' as const, completion: day.practices.pray },
		{ practiceId: 'Reflect' as const, completion: day.practices.reflect },
		...day.practices.optionalPractices,
	].map((practice) => ({
		...practice,
		journeyId: day.journeyId,
		dayNumber: day.dayNumber,
	}));
const applyCompletion = (
	session: IJourneyDaySession,
	result: ISetPracticeCompletionResult,
) => {
	const practices = session.day.practices;
	const completion =
		result.practiceId === 'ReadScripture'
			? practices.readScripture
			: result.practiceId === 'Pray'
				? practices.pray
				: result.practiceId === 'Reflect'
					? practices.reflect
					: practices.optionalPractices.find(
							(practice) =>
								practice.practiceId === result.practiceId,
						)?.completion;
	if (!completion || result.completion.revision <= completion.revision)
		return;
	if (result.practiceId === 'ReadScripture')
		practices.readScripture = result.completion;
	else if (result.practiceId === 'Pray') practices.pray = result.completion;
	else if (result.practiceId === 'Reflect')
		practices.reflect = result.completion;
	else {
		const assigned = practices.optionalPractices.find(
			(practice) => practice.practiceId === result.practiceId,
		);
		if (assigned) assigned.completion = result.completion;
	}
};
export const cachePracticeCompletion = (
	userId: string | null,
	startedGeneration: number,
	result: ISetPracticeCompletionResult,
) => {
	if (!userId || userId !== accountId || generation !== startedGeneration)
		return;
	for (const entry of sessions.values()) {
		if (
			entry.session.day.journeyId !== result.journeyId ||
			entry.session.day.dayNumber !== result.dayNumber
		)
			continue;
		applyCompletion(entry.session, result);
	}
	notify();
};
