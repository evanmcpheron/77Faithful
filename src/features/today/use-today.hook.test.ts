import type { IJourneyDaySession } from '@td/features/journey/journey-day-session.types';
import { useAuth } from '@td/providers/auth/auth.hook';
import type { IAuthContextValue } from '@td/providers/auth/auth.types';
import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { loadToday } from './today.service';
import { useToday } from './use-today.hook';

jest.mock('@td/providers/auth/auth.hook');
jest.mock('./today.service', () => ({
	loadToday: jest.fn(),
	saveTodayCompletion: jest.fn(),
}));
jest.mock('expo-router', () => ({
	useFocusEffect: (callback: () => void) => {
		const { useEffect } = jest.requireActual('react');
		useEffect(callback, [callback]);
	},
}));
jest.mock('react-native', () => ({
	AppState: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let renderer: ReactTestRenderer;
let current: ReturnType<typeof useToday>;
const Consumer = () => {
	const today = useToday();
	useEffect(() => {
		current = today;
	}, [today]);
	return null;
};
const account = (userId: string) =>
	jest.mocked(useAuth).mockReturnValue({
		account: { userId, isEmailConfirmed: true },
		isProfileReady: true,
	} as IAuthContextValue);
beforeEach(() => {
	jest.useFakeTimers();
	jest.setSystemTime(new Date(2026, 8, 10, 23, 59, 59));
	jest.clearAllMocks();
	jest.mocked(loadToday).mockReset();
	account('owner');
});
afterEach(() => {
	if (renderer) act(() => renderer.unmount());
	jest.useRealTimers();
});
const mount = async () => {
	await act(async () => {
		renderer = create(createElement(Consumer));
	});
};
it('refreshes the day when midnight passes while Today remains open', async () => {
	jest.mocked(loadToday).mockResolvedValue({ status: 'NoActiveJourney' });
	await mount();
	await act(async () => {
		jest.advanceTimersByTime(1000);
	});
	expect(loadToday).toHaveBeenCalledTimes(2);
});
it('hides previous account data and ignores a late response after switching accounts', async () => {
	let resolve!: (value: Awaited<ReturnType<typeof loadToday>>) => void;
	jest.mocked(loadToday)
		.mockReturnValueOnce(
			new Promise((done) => {
				resolve = done;
			}),
		)
		.mockResolvedValueOnce({ status: 'NoActiveJourney' });
	await mount();
	account('other');
	await act(async () => renderer.update(createElement(Consumer)));
	await act(async () => resolve({ status: 'Completed' }));
	expect(current.data).toEqual({ status: 'NoActiveJourney' });
});
it('shows a recoverable error and retries without sample practices', async () => {
	jest.mocked(loadToday)
		.mockRejectedValueOnce(new Error('offline'))
		.mockResolvedValueOnce({ status: 'NoActiveJourney' });
	await mount();
	expect(current.error).toContain('Check your connection');
	expect(current.practices).toEqual([]);
	await act(async () => current.refresh());
	expect(current.error).toBeNull();
	expect(current.data).toEqual({ status: 'NoActiveJourney' });
});

it('keeps the loaded session mounted while refreshing the same day', async () => {
	const completion = { status: 'NotMarked', revision: 2, updatedAt: null };
	const session = {
		day: {
			journeyId: 'journey',
			dayNumber: 1,
			calendarDate: '2026-09-10',
			practices: {
				readScripture: completion,
				pray: completion,
				reflect: completion,
				optionalPractices: [
					{ practiceId: 'Worship', completion },
					{ practiceId: 'Gratitude', completion },
				],
			},
		},
		content: { prayerPrompt: 'Pray', reflectionQuestion: 'Reflect' },
		scriptureReference: 'John 1',
	} as unknown as IJourneyDaySession;
	jest.mocked(loadToday).mockResolvedValueOnce({ status: 'Ready', session });
	await mount();
	let resolve!: (value: Awaited<ReturnType<typeof loadToday>>) => void;
	jest.mocked(loadToday).mockReturnValueOnce(
		new Promise((done) => {
			resolve = done;
		}),
	);
	let refresh!: Promise<void>;
	await act(async () => {
		refresh = current.refresh();
	});
	expect(current.session).toBe(session);
	expect(current.practices).toHaveLength(5);
	await act(async () => {
		resolve({ status: 'Ready', session });
		await refresh;
	});
	expect(current.session).toBe(session);
});
