import { onSnapshot } from 'firebase/firestore';
import { subscribeDaySessionInvalidation } from './day-session-invalidation.service';
import { clearDaySessions } from './journey-day-cache';

jest.mock('@td/services/firebase/firebase.instance', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
	collection: jest.fn(),
	doc: jest.fn(),
	onSnapshot: jest.fn(),
}));
jest.mock('./journey-day-cache', () => ({ clearDaySessions: jest.fn() }));

it('invalidates on translation and journey changes, ignores unrelated settings and stops old listeners', () => {
	const callbacks: ((snapshot: unknown) => void)[] = [];
	const stop = jest.fn();
	jest.mocked(onSnapshot).mockImplementation((...args: unknown[]) => {
		callbacks.push(args[1] as (snapshot: unknown) => void);
		return stop;
	});
	const unsubscribe = subscribeDaySessionInvalidation('owner');
	const preferences = (bibleVersionId: string, hasPendingWrites = false) => ({
		metadata: { hasPendingWrites },
		data: () => ({ bibleVersionId }),
	});
	const journeys = (id: string, status: string) => ({
		metadata: { hasPendingWrites: false },
		docs: [{ id, data: () => ({ state: { status } }) }],
	});
	callbacks[0]?.(preferences('Web'));
	callbacks[1]?.(journeys('first', 'Active'));
	jest.mocked(clearDaySessions).mockClear();
	callbacks[0]?.(preferences('Web'));
	callbacks[0]?.(preferences('Niv', true));
	expect(clearDaySessions).not.toHaveBeenCalled();
	callbacks[0]?.(preferences('Niv'));
	callbacks[1]?.(journeys('first', 'EndedEarly'));
	callbacks[1]?.(journeys('second', 'Active'));
	expect(clearDaySessions).toHaveBeenCalledTimes(3);
	unsubscribe();
	callbacks[0]?.(preferences('Web'));
	callbacks[1]?.(journeys('third', 'Active'));
	expect(clearDaySessions).toHaveBeenCalledTimes(3);
	expect(stop).toHaveBeenCalledTimes(2);
});
