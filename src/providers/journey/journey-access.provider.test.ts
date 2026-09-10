import { useAuth } from '@td/providers/auth/auth.hook';
import type { IAuthContextValue } from '@td/providers/auth/auth.types';
import { onSnapshot } from 'firebase/firestore';
import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	JourneyAccessProvider,
	useJourneyAccess,
} from './journey-access.provider';

jest.mock('@td/providers/auth/auth.hook');
jest.mock('@td/services/firebase/firebase.instance', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
	collection: jest.fn(),
	query: jest.fn(),
	limit: jest.fn(),
	where: jest.fn(),
	onSnapshot: jest.fn(),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let renderer: ReactTestRenderer;
let current: ReturnType<typeof useJourneyAccess>;
let next: (snapshot: {
	empty: boolean;
	metadata: { fromCache: boolean; hasPendingWrites: boolean };
}) => void;
let fail: () => void;
const unsubscribe = jest.fn();
const Consumer = () => {
	const access = useJourneyAccess();
	useEffect(() => {
		current = access;
	}, [access]);
	return null;
};
const element = () =>
	createElement(JourneyAccessProvider, { children: createElement(Consumer) });
const session = (userId: string | null, isEmailConfirmed = true) => {
	jest.mocked(useAuth).mockReturnValue({
		account: userId
			? { userId, isEmailConfirmed, contactEmail: 'reader@example.com' }
			: null,
		isProfileReady: true,
	} as IAuthContextValue);
};
beforeEach(() => {
	jest.resetAllMocks();
	jest.mocked(onSnapshot).mockImplementation(
		(
			_query: unknown,
			_options: unknown,
			onNext: unknown,
			onError: unknown,
		) => {
			next = onNext as typeof next;
			fail = onError as typeof fail;
			return unsubscribe;
		},
	);
	session('owner');
	act(() => {
		renderer = create(element());
	});
});
afterEach(() => act(() => renderer.unmount()));
const snapshot = (
	empty: boolean,
	fromCache = false,
	hasPendingWrites = false,
) => ({ empty, metadata: { fromCache, hasPendingWrites } });
it('waits for authoritative absence, then follows confirmed journey creation', () => {
	expect(current.isLoading).toBe(true);
	act(() => next(snapshot(true, true)));
	expect(current.isLoading).toBe(true);
	act(() => next(snapshot(true)));
	expect(current.hasJourney).toBe(false);
	expect(current.isLoading).toBe(false);
	act(() => next(snapshot(false, false, true)));
	expect(current.hasJourney).toBe(false);
	act(() => next(snapshot(false)));
	expect(current.hasJourney).toBe(true);
});
it('isolates account changes and ignores late snapshots from the previous account', () => {
	const oldNext = next;
	act(() => next(snapshot(false)));
	session('other');
	act(() => renderer.update(element()));
	expect(unsubscribe).toHaveBeenCalledTimes(1);
	expect(current.isLoading).toBe(true);
	act(() => oldNext(snapshot(false)));
	expect(current.hasJourney).toBe(false);
	session(null);
	act(() => renderer.update(element()));
	expect(current.hasJourney).toBe(false);
});
it('never subscribes to private journey data for an unverified account', () => {
	session('owner', false);
	act(() => renderer.update(element()));
	expect(unsubscribe).toHaveBeenCalledTimes(1);
	expect(current.isLoading).toBe(false);
	expect(current.hasJourney).toBe(false);
});
it('retries lookup errors without presenting them as an unfinished setup', () => {
	act(() => fail());
	expect(current.hasError).toBe(true);
	act(() => current.retry());
	expect(current.hasError).toBe(false);
	expect(current.isLoading).toBe(true);
	expect(onSnapshot).toHaveBeenCalledTimes(2);
});
