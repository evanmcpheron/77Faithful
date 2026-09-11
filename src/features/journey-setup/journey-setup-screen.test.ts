import { FirebaseError } from 'firebase/app';
import { createElement } from 'react';
import { Pressable } from 'react-native';
import {
	act,
	create,
	type ReactTestInstance,
	type ReactTestRenderer,
} from 'react-test-renderer';
import { JourneySetupScreen } from './journey-setup-screen.component';
import {
	JourneySetupConflictError,
	loadJourneySetup,
	saveJourneySetup,
	type IJourneySetupSnapshot,
} from './journey-setup.service';
import {
	createJourneyStartOperationId,
	startJourney,
} from './journey-start.service';
import { SetupPracticeChoice } from './setup-practice-choice.component';

jest.mock('@td/features/account/device-id.service', () => ({
	getDeviceId: async () => 'device-1',
}));
jest.mock('./journey-setup.service', () => ({
	loadJourneySetup: jest.fn(),
	saveJourneySetup: jest.fn(),
	JourneySetupConflictError: class extends Error {},
}));
jest.mock('./journey-start.service', () => ({
	startJourney: jest.fn(),
	createJourneyStartOperationId: jest.fn(),
}));
jest.mock('react-native', () => ({
	ScrollView: 'scroll',
	Pressable: 'radio',
	View: 'view',
}));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownStaticScreen: 'screen',
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'button',
}));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'text',
}));
jest.mock('@td/components/form/checkbox/checkbox.component', () => ({
	Checkbox: 'checkbox',
}));
jest.mock('@td/components/form/input/input.component', () => ({
	Input: 'input',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'card' }));
jest.mock('@td/components/ui/divider/divider.component', () => ({
	Divider: 'divider',
}));
jest.mock('@td/components/ui/progress-bar/progress-bar.component', () => ({
	ProgressBar: 'progress',
}));
jest.mock('@td/components/ui/loading-state/loading-state.component', () => ({
	LoadingState: 'loading',
}));
jest.mock('./setup-practice-choice.component', () => ({
	SetupPracticeChoice: 'practice',
}));
jest.mock('@td/components/form/dropdown/dropdown.component', () => ({
	Dropdown: 'dropdown',
}));
jest.mock('./journey-setup.styles', () => ({
	SetupColumn: 'column',
	SetupRow: 'row',
	SetupContainer: 'container',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let renderer: ReactTestRenderer;
const timestamp = { seconds: 1, nanoseconds: 0 };
const saved = (
	step: NonNullable<IJourneySetupSnapshot['draft']>['currentStep'],
): IJourneySetupSnapshot => ({
	draft: {
		schemaVersion: 1,
		userId: 'owner',
		revision: 2,
		currentStep: step,
		choices: {
			readiness: 'ReadyForReview',
			optionalPracticeIds: ['Movement', 'Gratitude'],
			bibleVersionId: 'Web',
		},
		startingMotivation: {
			revisionId: 'writing-1',
			text: 'Spend time with Jesus.',
			updatedAt: timestamp,
		},
		createdAt: timestamp,
		updatedAt: timestamp,
	},
	devicePreferences: {
		schemaVersion: 1,
		userId: 'owner',
		revision: 1,
		morningReminder: { isEnabled: true, localTime: '07:00' },
		eveningReflectionReminder: { isEnabled: true, localTime: '20:00' },
		createdAt: timestamp,
		updatedAt: timestamp,
	},
});
const mount = async (
	snapshot: IJourneySetupSnapshot = { draft: null, devicePreferences: null },
) => {
	jest.mocked(loadJourneySetup).mockResolvedValue(snapshot);
	await act(async () => {
		renderer = create(
			createElement(JourneySetupScreen, { userId: 'owner' }),
		);
	});
};
const textOf = (node: ReactTestInstance): string =>
	node.children
		.map((child) => (typeof child === 'string' ? child : textOf(child)))
		.join('');
const text = () => textOf(renderer.root);
const button = (label: string) =>
	renderer.root.find(
		(node) =>
			node.type === 'button' &&
			(textOf(node) === label ||
				node.props['accessibilityLabel'] === label),
	);
const press = async (label: string) => {
	const target = button(label);
	expect(target.props['disabled']).not.toBe(true);
	await act(async () => {
		await target.props['onPress']();
	});
};
const input = () => renderer.root.findByType('input');
const changeMotivation = async (value: string) => {
	await act(async () => input().props['onChange'](value));
};
beforeEach(() => {
	jest.resetAllMocks();
	jest.useFakeTimers({ now: new Date('2026-09-10T16:00:00Z') });
	jest.mocked(saveJourneySetup).mockResolvedValue(undefined);
	jest.mocked(createJourneyStartOperationId).mockReturnValue('operation-1');
});
afterEach(() => {
	act(() => renderer?.unmount());
	jest.useRealTimers();
});

it('starts with commitment, seven steps, and no required choices preselected', async () => {
	await mount();
	expect(text()).toContain('Step 1 of 7');
	expect(text()).toContain('Make room for life with Jesus');
	expect(text()).not.toContain('Back');
	await press('Continue');
	expect(text()).toContain('Step 2 of 7');
	expect(text()).toContain('0 selected · Choose 2–4');
	expect(button('Continue').props['disabled']).toBe(true);
	expect(saveJourneySetup).toHaveBeenLastCalledWith(
		expect.objectContaining({
			currentStep: 'Practices',
			choices: {
				readiness: 'Incomplete',
				optionalPracticeIds: [],
				bibleVersionId: null,
			},
			morningReminder: { isEnabled: false, localTime: '07:00' },
			eveningReflectionReminder: { isEnabled: false, localTime: '20:00' },
		}),
	);
});
it('enforces two to four selections while allowing selected practices to be removed', async () => {
	await mount();
	await press('Continue');
	const choices = () => renderer.root.findAllByType(SetupPracticeChoice);
	await act(async () => choices()[0]!.props['onChange'](true));
	expect(button('Continue').props['disabled']).toBe(true);
	await act(async () => choices()[1]!.props['onChange'](true));
	expect(button('Continue').props['disabled']).toBe(false);
	await act(async () => {
		choices()[2]!.props['onChange'](true);
		choices()[3]!.props['onChange'](true);
	});
	expect(text()).toContain(
		'To choose a different practice, deselect one first.',
	);
	expect(choices()[4]!.props['disabled']).toBe(true);
	expect(choices()[0]!.props['disabled']).toBe(false);
	await act(async () => choices()[0]!.props['onChange'](false));
	expect(choices()[4]!.props['disabled']).toBe(false);
	await press('Continue');
	expect(text()).toContain('Choose a translation to continue.');
	expect(renderer.root.findAllByType(Pressable)).toHaveLength(9);
	expect(button('Continue').props['disabled']).toBe(true);
});
it('resumes at the saved step and autosaves motivation after 700 ms', async () => {
	await mount(saved('Motivation'));
	expect(text()).toContain('Step 4 of 7');
	expect(input().props['value']).toBe('Spend time with Jesus.');
	await changeMotivation('New private motivation');
	expect(text()).toContain('Changes not yet saved');
	await act(async () => jest.advanceTimersByTime(699));
	expect(saveJourneySetup).not.toHaveBeenCalled();
	await act(async () => jest.advanceTimersByTime(1));
	expect(saveJourneySetup).toHaveBeenCalledWith(
		expect.objectContaining({ motivation: 'New private motivation' }),
	);
	expect(text()).toContain('Saved to your account');
});
it('saves the latest text before navigating and stays on the step during the save', async () => {
	await mount(saved('Motivation'));
	await changeMotivation('Latest text');
	let finish!: () => void;
	jest.mocked(saveJourneySetup).mockImplementationOnce(
		() =>
			new Promise<void>((resolve) => {
				finish = resolve;
			}),
	);
	let navigation!: Promise<void>;
	await act(async () => {
		navigation = button('Continue').props['onPress']();
	});
	expect(text()).toContain('Step 4 of 7');
	expect(text()).toContain('Saving…');
	await act(async () => {
		finish();
		await navigation;
	});
	expect(text()).toContain('Step 5 of 7');
	expect(saveJourneySetup).toHaveBeenCalledWith(
		expect.objectContaining({
			motivation: 'Latest text',
			currentStep: 'Reminders',
		}),
	);
});
it('caps motivation at 10000 characters and skip clears saved writing', async () => {
	await mount(saved('Motivation'));
	await changeMotivation('x'.repeat(10001));
	expect(input().props['value']).toHaveLength(10000);
	await press('Skip for now');
	expect(saveJourneySetup).toHaveBeenLastCalledWith(
		expect.objectContaining({ motivation: '', currentStep: 'Reminders' }),
	);
});
it('skip disables both reminders while retaining their clock times', async () => {
	await mount(saved('Reminders'));
	await press('Skip for now');
	expect(saveJourneySetup).toHaveBeenLastCalledWith(
		expect.objectContaining({
			morningReminder: { isEnabled: false, localTime: '07:00' },
			eveningReflectionReminder: { isEnabled: false, localTime: '20:00' },
			currentStep: 'WeeklyThemes',
		}),
	);
	expect(text()).toContain('Step 6 of 7');
	expect(text()).toContain('Week 11');
});
it('review Change opens a focused edit and both Return and Back go directly to Review', async () => {
	await mount(saved('Review'));
	await press('Change Bible translation');
	expect(text()).toContain('Step 3 of 7');
	await press('Return to review');
	expect(text()).toContain('Step 7 of 7');
	await press('Change 5 daily practices');
	await press('Back');
	expect(text()).toContain('Step 7 of 7');
});
it('skip from a Review motivation edit clears writing and returns directly to Review', async () => {
	await mount(saved('Review'));
	await press('Change Starting motivation');
	await press('Skip for now');
	expect(text()).toContain('Step 7 of 7');
	expect(text()).toContain('Not provided');
	expect(saveJourneySetup).toHaveBeenLastCalledWith(
		expect.objectContaining({ motivation: '', currentStep: 'Review' }),
	);
});
it('preserves visible edits after save failure, stops autosave, and offers retry', async () => {
	await mount(saved('Motivation'));
	await changeMotivation('Keep this writing');
	jest.mocked(saveJourneySetup).mockRejectedValueOnce(new Error('offline'));
	await press('Continue');
	expect(text()).toContain(
		'Your latest changes haven’t been saved. Check your connection and try again.',
	);
	expect(input().props['value']).toBe('Keep this writing');
	await act(async () => jest.advanceTimersByTime(5000));
	expect(saveJourneySetup).toHaveBeenCalledTimes(1);
	await press('Try saving again');
	expect(text()).toContain('Saved to your account');
});
it('a conflict retains writing and requires loading the saved setup', async () => {
	await mount(saved('Motivation'));
	await changeMotivation('Keep local words');
	jest.mocked(saveJourneySetup).mockRejectedValueOnce(
		new JourneySetupConflictError(),
	);
	await press('Continue');
	expect(text()).toContain(
		'Your setup changed in another session. Your edits are still shown here.',
	);
	expect(input().props['value']).toBe('Keep local words');
	expect(button('Continue').props['disabled']).toBe(true);
	await press('Load saved setup');
	expect(input().props['value']).toBe('Spend time with Jesus.');
});
it('shows combined reminder copy when both times match', async () => {
	const snapshot = saved('Reminders');
	snapshot.devicePreferences = {
		...snapshot.devicePreferences!,
		eveningReflectionReminder: { isEnabled: true, localTime: '07:00' },
	};
	await mount(snapshot);
	expect(text()).toContain(
		'Both times match. One combined reminder would invite you to read, pray, and reflect.',
	);
	await press('Continue');
	await press('Continue');
	expect(text()).toContain('Combined reminder at 7:00 AM');
});
it('updates review dates when the local day changes', async () => {
	await mount(saved('Review'));
	expect(text()).toContain('Day 1 · September 10, 2026');
	jest.setSystemTime(new Date('2026-09-11T16:00:00Z'));
	await act(async () => jest.advanceTimersByTime(1000));
	expect(text()).toContain('Day 1 · September 11, 2026');
	expect(text()).toContain(
		'Your local date changed. Review the dates before continuing.',
	);
});
it('requires another deliberate Start when the server changes the reviewed date', async () => {
	await mount(saved('Review'));
	jest.mocked(startJourney).mockResolvedValue({
		outcome: 'ReviewChanged',
		review: {
			reviewedStartDate: '2026-09-11',
			observedPhoneTimeZoneId: 'UTC',
		},
		day77Date: '2026-11-26',
	});
	await press('Start my journey');
	expect(text()).toContain(
		'The date has changed. Review the updated dates, then select Start my journey.',
	);
	expect(startJourney).toHaveBeenCalledTimes(1);
	expect(button('Start my journey').props['disabled']).toBe(false);
});
it('keeps the operation id across uncertain start retries', async () => {
	await mount(saved('Review'));
	jest.mocked(startJourney).mockRejectedValue(new Error('lost response'));
	await press('Start my journey');
	await press('Start my journey');
	expect(createJourneyStartOperationId).toHaveBeenCalledTimes(1);
	expect(
		jest
			.mocked(startJourney)
			.mock.calls.map(([request]) => request.operationId),
	).toEqual(['operation-1', 'operation-1']);
	expect(text()).toContain(
		'We couldn’t confirm that your journey started. Your setup is saved. Please try Start my journey again shortly.',
	);
});
it('retains setup and shows the specified unavailable-readings error', async () => {
	await mount(saved('Review'));
	const error = new FirebaseError(
		'functions/failed-precondition',
		'unavailable',
	);
	Object.assign(error, { details: { reason: 'ContentUnavailable' } });
	jest.mocked(startJourney).mockRejectedValue(error);
	await press('Start my journey');
	expect(text()).toContain(
		'The daily readings for your selected translation aren’t ready yet. Your setup is saved. Please try again later.',
	);
	expect(text()).toContain('Spend time with Jesus.');
});

it('preserves focused Review editing after a save failure and retry', async () => {
	await mount(saved('Review'));
	await press('Change Starting motivation');
	await changeMotivation('Keep editing');
	jest.mocked(saveJourneySetup).mockRejectedValueOnce(new Error('offline'));
	await press('Return to review');
	await press('Try saving again');
	expect(button('Return to review')).toBeDefined();
});
it('skip from a Review reminder edit turns both off and returns to Review', async () => {
	await mount(saved('Review'));
	await press('Change Reminder choices');
	await press('Skip for now');
	expect(text()).toContain('Step 7 of 7');
	expect(saveJourneySetup).toHaveBeenLastCalledWith(
		expect.objectContaining({
			currentStep: 'Review',
			morningReminder: { isEnabled: false, localTime: '07:00' },
			eveningReflectionReminder: { isEnabled: false, localTime: '20:00' },
		}),
	);
});
it('shows only a loading state while setup restoration is pending', async () => {
	let restore!: (snapshot: IJourneySetupSnapshot) => void;
	jest.mocked(loadJourneySetup).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				restore = resolve;
			}),
	);
	await mount();
	expect(
		renderer.root.findByProps({ label: 'Loading your setup' }),
	).toBeDefined();
	expect(text()).not.toContain('Step 1');
	await act(async () => restore(saved('Reminders')));
	expect(text()).toContain('Step 5 of 7');
});
it('does not call Start when the date changes while the latest setup is being saved', async () => {
	await mount(saved('Review'));
	let finish!: () => void;
	jest.mocked(saveJourneySetup).mockImplementationOnce(
		() =>
			new Promise<void>((resolve) => {
				finish = resolve;
			}),
	);
	let starting!: Promise<void>;
	await act(async () => {
		starting = button('Start my journey').props['onPress']();
	});
	jest.setSystemTime(new Date('2026-09-11T16:00:00Z'));
	await act(async () => {
		finish();
		await starting;
	});
	expect(startJourney).not.toHaveBeenCalled();
	expect(text()).toContain(
		'The date has changed. Review the updated dates, then select Start my journey.',
	);
});
it.each([
	[
		'functions/unauthenticated',
		'Your session needs to be refreshed. Your setup is saved. Sign out and sign in again before starting.',
	],
	[
		'functions/permission-denied',
		'We couldn’t confirm access to start your journey. Your setup is saved. Confirm your email, then sign in again.',
	],
	[
		'functions/not-found',
		'Starting your journey is temporarily unavailable. Your setup is saved. Please try again later.',
	],
	[
		'functions/internal',
		'Starting your journey is temporarily unavailable. Your setup is saved. Please try again later.',
	],
])(
	'preserves setup and displays the exact recovery copy for %s',
	async (code, message) => {
		await mount(saved('Review'));
		jest.mocked(startJourney).mockRejectedValue(
			new FirebaseError(code, 'failed'),
		);
		await press('Start my journey');
		expect(text()).toContain(message);
		expect(text()).toContain('Spend time with Jesus.');
	},
);
it('shows Starting then Opening today and blocks duplicate Start calls', async () => {
	await mount(saved('Review'));
	let complete!: (result: Awaited<ReturnType<typeof startJourney>>) => void;
	jest.mocked(startJourney).mockImplementation(
		() =>
			new Promise((resolve) => {
				complete = resolve;
			}),
	);
	let starting!: Promise<void>;
	await act(async () => {
		starting = button('Start my journey').props['onPress']();
	});
	expect(button('Starting…').props['disabled']).toBe(true);
	await act(async () => button('Starting…').props['onPress']());
	expect(startJourney).toHaveBeenCalledTimes(1);
	await act(async () => {
		complete({
			outcome: 'Started',
			details: {
				journeyId: 'journey-1',
				day77Date: '2026-11-25',
				journey: {
					schemaVersion: 1,
					userId: 'owner',
					course: { courseId: 'course', courseVersionId: 'v1' },
					startDate: '2026-09-10',
					timeZoneId: 'UTC',
					initialOptionalPracticeIds: ['Movement', 'Gratitude'],
					practiceScheduleRevision: 0,
					state: { status: 'Active' },
					startingMotivation: null,
					createdAt: timestamp,
					updatedAt: timestamp,
				},
			},
		});
		await starting;
	});
	expect(button('Opening today…').props['disabled']).toBe(true);
});
