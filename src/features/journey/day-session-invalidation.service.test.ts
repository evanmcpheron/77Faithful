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

it('invalidates on translation changes, ignores unrelated settings and stops old listeners', () => {
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
	callbacks[0]?.(preferences('Web'));
	jest.mocked(clearDaySessions).mockClear();
	callbacks[0]?.(preferences('Web'));
	callbacks[0]?.(preferences('Niv', true));
	expect(clearDaySessions).not.toHaveBeenCalled();
	callbacks[0]?.(preferences('Niv'));
	expect(clearDaySessions).toHaveBeenCalledTimes(1);
	unsubscribe();
	callbacks[0]?.(preferences('Web'));
	expect(clearDaySessions).toHaveBeenCalledTimes(1);
	expect(stop).toHaveBeenCalledTimes(1);
});
