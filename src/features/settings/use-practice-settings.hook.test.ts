import { useAuth } from '@td/providers/auth/auth.hook';
import type { IAuthContextValue } from '@td/providers/auth/auth.types';
import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	cancelPracticeSettings,
	confirmPracticeSettings,
	loadPracticeSettings,
} from './practice-settings.service';
import type { TPracticeSettingsResult } from './practice-settings.types';
import { usePracticeSettings } from './use-practice-settings.hook';

jest.mock('@td/providers/auth/auth.hook');
jest.mock('./practice-settings.service', () => ({
	loadPracticeSettings: jest.fn(),
	confirmPracticeSettings: jest.fn(),
	cancelPracticeSettings: jest.fn(),
}));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'operation-1') }));
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
let current: ReturnType<typeof usePracticeSettings>;
const Consumer = () => {
	const settings = usePracticeSettings();
	useEffect(() => {
		current = settings;
	}, [settings]);
	return null;
};
const ready: Extract<TPracticeSettingsResult, { status: 'Ready' }> = {
	status: 'Ready',
	dayNumber: 1,
	calendarDate: '2026-09-11',
	nextDay: { dayNumber: 2, calendarDate: '2026-09-12' },
	selection: {
		journeyId: 'current',
		currentOptionalPracticeIds: ['Movement', 'Gratitude'],
		scheduleRevision: 0,
		pendingChange: null,
	},
};
const changed = {
	...ready.selection,
	scheduleRevision: 1,
	pendingChange: {
		practiceChangeId: 'change-1',
		optionalPracticeIds: ['Worship', 'Generosity'] as const,
		effectiveDayNumber: 2,
		effectiveDate: '2026-09-12' as const,
	},
};
const account = (userId: string) =>
	jest.mocked(useAuth).mockReturnValue({
		account: { userId, isEmailConfirmed: true },
		isProfileReady: true,
	} as IAuthContextValue);
beforeEach(() => {
	jest.useFakeTimers();
	jest.setSystemTime(new Date(2026, 8, 11, 23, 59, 59));
	jest.clearAllMocks();
	jest.mocked(loadPracticeSettings).mockReset().mockResolvedValue(ready);
	jest.mocked(confirmPracticeSettings).mockReset();
	jest.mocked(cancelPracticeSettings).mockReset();
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
it('sends the server-reviewed date and revision, then reloads after confirmation', async () => {
	jest.mocked(confirmPracticeSettings).mockResolvedValue(changed);
	await mount();
	await act(async () => {
		await current.confirm(['Worship', 'Generosity']);
	});
	expect(confirmPracticeSettings).toHaveBeenCalledWith(
		expect.objectContaining({
			reviewedEffectiveDate: '2026-09-12',
			reviewedEffectiveDayNumber: 2,
			expectedScheduleRevision: 0,
			operationId: 'operation-1',
		}),
	);
	expect(current.notice).toBe('Your practice change is confirmed.');
	expect(loadPracticeSettings).toHaveBeenCalledTimes(2);
});
it('retries an ambiguous outcome with the identical operation and prevents competing submissions', async () => {
	jest.mocked(confirmPracticeSettings)
		.mockRejectedValueOnce(new Error('connection lost'))
		.mockResolvedValueOnce(changed);
	await mount();
	await act(async () => {
		await current.confirm(['Worship', 'Generosity']);
	});
	const original = jest.mocked(confirmPracticeSettings).mock.calls[0]![0];
	expect(current.hasUnconfirmedChange).toBe(true);
	await act(async () => {
		await current.confirm(['Movement', 'Worship']);
	});
	expect(confirmPracticeSettings).toHaveBeenCalledTimes(1);
	await act(async () => {
		await current.retry();
	});
	expect(jest.mocked(confirmPracticeSettings).mock.calls[1]![0]).toEqual(
		original,
	);
	expect(current.hasUnconfirmedChange).toBe(false);
});
it('requires a fresh review after a stale schedule rejection', async () => {
	jest.mocked(confirmPracticeSettings).mockRejectedValue({
		code: 'functions/failed-precondition',
	});
	await mount();
	await act(async () => {
		await current.confirm(['Worship', 'Generosity']);
	});
	expect(current.needsReview).toBe(true);
	expect(current.hasUnconfirmedChange).toBe(false);
	await act(async () => {
		await current.confirm(['Movement', 'Worship']);
	});
	expect(confirmPracticeSettings).toHaveBeenCalledTimes(1);
	await act(async () => current.refresh());
	expect(current.needsReview).toBe(false);
});
it('refreshes calendar context at midnight', async () => {
	await mount();
	await act(async () => jest.advanceTimersByTime(1000));
	expect(loadPracticeSettings).toHaveBeenCalledTimes(2);
});
it('cancels the pending change with its ID and schedule revision', async () => {
	jest.mocked(loadPracticeSettings).mockResolvedValue({
		...ready,
		selection: changed,
	});
	jest.mocked(cancelPracticeSettings).mockResolvedValue({
		...ready.selection,
		scheduleRevision: 2,
	});
	await mount();
	await act(async () => {
		await current.cancel();
	});
	expect(cancelPracticeSettings).toHaveBeenCalledWith(
		expect.objectContaining({
			practiceChangeId: 'change-1',
			expectedScheduleRevision: 1,
		}),
	);
	expect(current.notice).toContain('canceled');
});
it('ignores late responses and clears mutation state when accounts change', async () => {
	let resolve!: (value: typeof changed) => void;
	jest.mocked(confirmPracticeSettings).mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	await mount();
	let completion!: Promise<boolean>;
	act(() => {
		completion = current.confirm(['Worship', 'Generosity']);
	});
	account('other');
	jest.mocked(loadPracticeSettings).mockResolvedValue({
		status: 'NoActiveJourney',
	});
	await act(async () => renderer.update(createElement(Consumer)));
	await act(async () => {
		resolve(changed);
		await completion;
	});
	expect(current.data).toEqual({ status: 'NoActiveJourney' });
	expect(current.notice).toBeNull();
	expect(current.hasUnconfirmedChange).toBe(false);
});
