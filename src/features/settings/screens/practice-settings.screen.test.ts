import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { setupPractices } from '@td/features/journey-setup/journey-setup-content';
import { SetupPracticeChoice } from '@td/features/journey-setup/setup-practice-choice.component';
import { createElement } from 'react';
import { Pressable } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { TPracticeSettingsResult } from '../practice-settings.types';
import { usePracticeSettings } from '../use-practice-settings.hook';
import { PracticeSettingsScreen } from './practice-settings.screen';

jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 100,
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../use-practice-settings.hook', () => ({
	usePracticeSettings: jest.fn(),
}));
jest.mock('@td/features/journey-setup/setup-practice-choice.component', () => ({
	SetupPracticeChoice: 'choice',
}));
jest.mock('react-native', () => ({ View: 'view', Pressable: 'pressable' }));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownScrollScreen: 'screen',
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'button',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'card' }));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'text',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let renderer: ReactTestRenderer;
const refresh = jest.fn();
const confirm = jest.fn();
const cancel = jest.fn();
const retry = jest.fn();
const ready: Extract<TPracticeSettingsResult, { status: 'Ready' }> = {
	status: 'Ready',
	dayNumber: 12,
	calendarDate: '2026-09-11',
	nextDay: { dayNumber: 13, calendarDate: '2026-09-12' },
	selection: {
		journeyId: 'current',
		currentOptionalPracticeIds: ['Worship', 'Generosity'],
		scheduleRevision: 0,
		pendingChange: null,
	},
};
const render = (state: object = {}) => {
	jest.mocked(usePracticeSettings).mockReturnValue({
		data: null,

		error: null,
		mutationError: null,
		isSaving: false,
		needsReview: false,
		hasUnconfirmedChange: false,
		notice: null,
		reviewVersion: 0,
		confirm,
		cancel,
		retry,
		refresh,
		...state,
	} as ReturnType<typeof usePracticeSettings>);
	act(() => {
		renderer = create(createElement(PracticeSettingsScreen));
	});
};
const text = () => JSON.stringify(renderer.toJSON());
const action = (label: string) =>
	renderer.root
		.findAllByType(TurndownButton)
		.find((node) => node.props['children'] === label)!;
const guidance = (name: string) =>
	renderer.root
		.findAllByType(Pressable)
		.find((node) => node.props['accessibilityLabel'] === name)!;

beforeEach(() => jest.clearAllMocks());
afterEach(() => act(() => renderer.unmount()));

it('keeps the full catalog available while current assignments load', () => {
	render();
	expect(text()).toContain('Loading your practices');
	expect(renderer.root.findAllByType(Pressable)).toHaveLength(10);
	expect(
		renderer.root
			.findAllByType(Card)
			.filter((card) => card.props['variant'] === 'Muted'),
	).toHaveLength(0);
});

it('shows current day assignments without duplicating them in the remaining catalog', () => {
	render({
		data: ready,
	});
	const chosen = renderer.root
		.findAllByType(Card)
		.filter((card) => card.props['variant'] === 'Muted');
	expect(chosen).toHaveLength(2);
	expect(chosen[0]!.findByType(Pressable).props['accessibilityLabel']).toBe(
		'Show Worship guidance',
	);
	expect(chosen[1]!.findByType(Pressable).props['accessibilityLabel']).toBe(
		'Show Generosity guidance',
	);
	expect(renderer.root.findAllByType(Pressable)).toHaveLength(10);
	expect(action('Change Chosen Practices').props['disabled']).toBe(false);
});

it('expands and collapses guidance with an accessible state and the catalog boundaries', () => {
	render();
	const movement = setupPractices.find(
		(practice) => practice.practiceId === 'Movement',
	)!;
	expect(text()).not.toContain(movement.boundaries);
	act(() => guidance('Show Movement guidance').props['onPress']());
	expect(
		guidance('Hide Movement guidance').props['accessibilityState'],
	).toEqual({ expanded: true });
	expect(text()).toContain(movement.boundaries);
	act(() => guidance('Hide Movement guidance').props['onPress']());
	expect(
		guidance('Show Movement guidance').props['accessibilityState'],
	).toEqual({ expanded: false });
	expect(text()).not.toContain(movement.boundaries);
});

it('offers a retry without presenting stale assignments as current', () => {
	render({
		error: 'We couldn’t load today’s practices. Check your connection and try again.',
		data: ready,
	});
	act(() => action('Try again').props['onPress']());
	expect(refresh).toHaveBeenCalledTimes(1);
	expect(
		renderer.root
			.findAllByType(Card)
			.filter((card) => card.props['variant'] === 'Muted'),
	).toHaveLength(0);
	expect(renderer.root.findAllByType(Pressable)).toHaveLength(10);
});

it.each([
	['NoActiveJourney', 'You don’t have an active journey.'],
	['Completed', 'Your 77-day period is complete.'],
	['NotStarted', 'Your journey’s practices are not available for today yet.'],
])(
	'explains the %s state and provides a route to Journey',
	(status, message) => {
		render({ data: { status } });
		expect(text()).toContain(message);
		expect(renderer.root.findAllByType(Pressable)).toHaveLength(10);
		act(() => action('Go to Journey').props['onPress']());
		expect(mockPush).toHaveBeenCalledWith('/journey');
	},
);

const choice = (id: string) =>
	renderer.root
		.findAllByType(SetupPracticeChoice)
		.find((node) => node.props['practice'].practiceId === id)!;
it('requires two to four distinct choices and a deliberate review before confirmation', () => {
	render({ data: ready });
	act(() => action('Change Chosen Practices').props['onPress']());
	expect(action('Review change').props['disabled']).toBe(true);
	act(() => choice('Worship').props['onChange'](false));
	expect(action('Review change').props['disabled']).toBe(true);
	act(() => choice('Movement').props['onChange'](true));
	act(() => choice('Gratitude').props['onChange'](true));
	act(() => choice('ChristianReading').props['onChange'](true));
	expect(choice('Worship').props['disabled']).toBe(true);
	expect(choice('Movement').props['disabled']).toBe(false);
	act(() => choice('Movement').props['onChange'](true));
	act(() => choice('Worship').props['onChange'](true));
	act(() => action('Review change').props['onPress']());
	expect(text()).toContain('September 12, 2026');
	expect(text()).toContain('Current practices');
	expect(confirm).not.toHaveBeenCalled();
	act(() => action('Confirm practice change').props['onPress']());
	expect(confirm).toHaveBeenCalledWith([
		'Generosity',
		'Movement',
		'Gratitude',
		'ChristianReading',
	]);
});
it('shows pending choices and requires confirmation to cancel them', () => {
	render({
		data: {
			...ready,
			selection: {
				...ready.selection,
				scheduleRevision: 1,
				pendingChange: {
					practiceChangeId: 'change1',
					optionalPracticeIds: ['Movement', 'Gratitude'],
					effectiveDayNumber: 13,
					effectiveDate: '2026-09-12',
				},
			},
		},
	});
	expect(text()).toContain('Upcoming practices');
	expect(action('Revise upcoming practices')).toBeDefined();
	act(() => action('Cancel upcoming change').props['onPress']());
	expect(cancel).not.toHaveBeenCalled();
	act(() => action('Confirm cancellation').props['onPress']());
	expect(cancel).toHaveBeenCalledTimes(1);
});
it('disables changes when there is no remaining unassigned next day', () => {
	render({ data: { ...ready, dayNumber: 77, nextDay: null } });
	expect(text()).toContain('You’re on Day 77');
	expect(action('Change Chosen Practices')).toBeUndefined();
});
it('keeps uncertain-outcome retry available even when the journey is no longer active', () => {
	render({
		data: { status: 'NoActiveJourney' },
		hasUnconfirmedChange: true,
		mutationError: 'Check your connection and retry this change.',
	});
	act(() => action('Retry this change').props['onPress']());
	expect(retry).toHaveBeenCalledTimes(1);
});
