import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { loadReflections } from './reflections.service';
import { useReflections } from './use-reflections.hook';
let accountId = 'owner';
jest.mock('./reflections.service');
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({
		account: { userId: accountId, isEmailConfirmed: true },
		isProfileReady: true,
	}),
}));
jest.mock('expo-router', () => ({
	useFocusEffect: (callback: () => void) => {
		const { useEffect } = jest.requireActual('react');
		useEffect(callback, [callback]);
	},
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let current: ReturnType<typeof useReflections>;
let renderer: ReactTestRenderer;
const Probe = () => {
	const value = useReflections();
	useEffect(() => {
		current = value;
	});
	return null;
};
const cursor = { journeyId: 'journey', beforeDayNumber: 40 };
beforeEach(async () => {
	accountId = 'owner';
	jest.mocked(loadReflections).mockReset();
	jest.mocked(loadReflections).mockResolvedValue({
		entries: [],
		nextCursor: cursor,
	});
	await act(async () => {
		renderer = create(createElement(Probe));
	});
});
afterEach(async () => {
	await act(async () => renderer.unmount());
});
it('loads only the next page and refreshes the selected page when returning from an entry', async () => {
	jest.mocked(loadReflections).mockResolvedValue({
		entries: [],
		nextCursor: null,
	});
	await act(async () => current.older());
	expect(loadReflections).toHaveBeenLastCalledWith('owner', cursor);
	expect(current.hasNewer).toBe(true);
	expect(current.hasOlder).toBe(false);
	await act(async () => current.refresh());
	expect(loadReflections).toHaveBeenLastCalledWith('owner', cursor);
	await act(async () => current.newer());
	expect(loadReflections).toHaveBeenLastCalledWith('owner', null);
});
it('resets pagination when the signed-in account changes', async () => {
	await act(async () => current.older());
	accountId = 'other';
	await act(async () => renderer.update(createElement(Probe)));
	expect(loadReflections).toHaveBeenLastCalledWith('other', null);
	expect(current.hasNewer).toBe(false);
});
it('keeps a way back to the newer page after an older-page failure', async () => {
	jest.mocked(loadReflections).mockRejectedValue(new Error('offline'));
	await act(async () => current.older());
	expect(current.error).toBe(true);
	expect(current.entries).toBeNull();
	expect(current.hasNewer).toBe(true);
	jest.mocked(loadReflections).mockResolvedValue({
		entries: [],
		nextCursor: cursor,
	});
	await act(async () => current.newer());
	expect(current.error).toBe(false);
	expect(loadReflections).toHaveBeenLastCalledWith('owner', null);
});
