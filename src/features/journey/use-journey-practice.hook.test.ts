import { useAuth } from '@td/providers/auth/auth.hook';
import type { IAuthContextValue } from '@td/providers/auth/auth.types';
import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { IJourneyDaySession } from './journey-day-session.types';
import { parsePracticeRoute } from './journey-practice-route';
import {
	loadPracticeDay,
	savePracticeCompletion,
} from './journey-practice.service';
import { useJourneyPractice } from './use-journey-practice.hook';

jest.mock('@td/providers/auth/auth.hook');
jest.mock('./journey-practice.service');
jest.mock('expo-router', () => ({
	useFocusEffect: (callback: () => void) => {
		const { useEffect } = jest.requireActual('react');
		useEffect(callback, [callback]);
	},
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const completion = {
	status: 'NotMarked',
	revision: 2,
	updatedAt: null,
} as const;
const session = {
	day: {
		userId: 'owner',
		journeyId: 'journey',
		dayNumber: 12,
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
	content: {
		prayerPrompt: 'Daily prompt',
		reflectionQuestion: 'Daily question',
	},
	scriptureReference: 'John 1',
} as unknown as IJourneyDaySession;
let current: ReturnType<typeof useJourneyPractice>;
let renderer: ReactTestRenderer;
let practiceId = 'Worship';
const Consumer = () => {
	const practice = useJourneyPractice(
		parsePracticeRoute('journey', '12', practiceId),
	);
	useEffect(() => {
		current = practice;
	}, [practice]);
	return null;
};
beforeEach(() => {
	jest.resetAllMocks();
	practiceId = 'Worship';
	jest.mocked(useAuth).mockReturnValue({
		account: { userId: 'owner', isEmailConfirmed: true },
		isProfileReady: true,
	} as IAuthContextValue);
	jest.mocked(loadPracticeDay).mockResolvedValue(session);
});
afterEach(() => {
	if (renderer) act(() => renderer.unmount());
});
const mount = async () => {
	await act(async () => {
		renderer = create(createElement(Consumer));
	});
};
it('loads the routed day and saves only its assigned practice with the current revision', async () => {
	jest.mocked(savePracticeCompletion).mockResolvedValue({
		journeyId: 'journey',
		dayNumber: 12,
		practiceId: 'Worship',
		completion: { ...completion, status: 'Complete', revision: 3 },
	});
	await mount();
	expect(loadPracticeDay).toHaveBeenCalledWith('owner', 'journey', 12);
	expect(savePracticeCompletion).not.toHaveBeenCalled();
	await act(async () => {
		await Promise.all([current.complete(), current.complete()]);
	});
	expect(savePracticeCompletion).toHaveBeenCalledTimes(1);
	expect(savePracticeCompletion).toHaveBeenCalledWith({
		journeyId: 'journey',
		dayNumber: 12,
		practiceId: 'Worship',
		isComplete: true,
		expectedCompletionRevision: 2,
	});
	expect(current.completion?.status).toBe('Complete');
	await act(async () => current.complete());
	expect(savePracticeCompletion).toHaveBeenCalledTimes(1);
});
it('keeps failed saves incomplete and requires a refresh before retry', async () => {
	jest.mocked(savePracticeCompletion).mockRejectedValue(
		new Error('conflict'),
	);
	await mount();
	await act(async () => current.complete());
	expect(current.completion?.status).toBe('NotMarked');
	expect(current.error).toContain('Refresh this practice');
	await act(async () => current.complete());
	expect(savePracticeCompletion).toHaveBeenCalledTimes(1);
	await act(async () => current.refresh());
	expect(current.error).toBeNull();
});
it('does not display or complete an unassigned optional practice', async () => {
	practiceId = 'Movement';
	await mount();
	expect(current.session).toBeNull();
	expect(current.error).toBeTruthy();
	await act(async () => current.complete());
	expect(savePracticeCompletion).not.toHaveBeenCalled();
});
it('does not request content for an invalid route', async () => {
	practiceId = 'invalid';
	await mount();
	expect(loadPracticeDay).not.toHaveBeenCalled();
});
it('hides content when the account changes and ignores the previous load', async () => {
	let resolve!: (value: IJourneyDaySession) => void;
	jest.mocked(loadPracticeDay)
		.mockReturnValueOnce(
			new Promise((done) => {
				resolve = done;
			}),
		)
		.mockRejectedValueOnce(new Error('not found'));
	await mount();
	jest.mocked(useAuth).mockReturnValue({
		account: { userId: 'other', isEmailConfirmed: true },
		isProfileReady: true,
	} as IAuthContextValue);
	await act(async () => renderer.update(createElement(Consumer)));
	await act(async () => resolve(session));
	expect(current.session).toBeNull();
});
