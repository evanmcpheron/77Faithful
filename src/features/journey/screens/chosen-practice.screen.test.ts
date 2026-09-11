import { setupPractices } from '@td/features/journey-setup/journey-setup-content';
import { createElement } from 'react';
import {
	act,
	create,
	type ReactTestInstance,
	type ReactTestRenderer,
} from 'react-test-renderer';
import type { IJourneyDaySession } from '../journey-day-session.types';
import { getPracticeHref } from '../journey-practice-route';
import { useJourneyPractice } from '../use-journey-practice.hook';
import { ChosenPracticeScreen } from './chosen-practice.screen';

jest.mock('../use-journey-practice.hook');
const mockPush = jest.fn();
let mockPracticeId: unknown = 'Movement';
let mockPreview: string | undefined;
jest.mock('expo-router', () => ({
	useLocalSearchParams: () => ({
		journeyId: 'journey',
		dayNumber: '12',
		practiceId: mockPracticeId,
		preview: mockPreview,
	}),
	useRouter: () => ({ push: mockPush }),
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 100,
}));
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
jest.mock('./scripture.styles', () => ({
	ReadingColumn: 'column',
	ReadingTitle: 'title',
	PassageSection: 'section',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
// Only the session fields read by this screen are needed in this fixture.
const session = {
	day: { journeyId: 'journey', dayNumber: 12 },
	scriptureReference: 'John 15:1–5',
} as IJourneyDaySession;
const completion = {
	status: 'NotMarked',
	revision: 2,
	updatedAt: null,
} as const;
const complete = jest.fn();
const refresh = jest.fn();
let renderer: ReactTestRenderer;
const textOf = (node: ReactTestInstance): string =>
	node.children
		.map((child): string =>
			typeof child === 'string' ? child : textOf(child),
		)
		.join('');
const button = (label: string) =>
	renderer.root.find(
		(node) => node.type === 'button' && textOf(node) === label,
	);
const render = async () => {
	await act(async () => {
		renderer = create(createElement(ChosenPracticeScreen));
	});
};
beforeEach(() => {
	jest.clearAllMocks();
	mockPracticeId = 'Movement';
	mockPreview = undefined;
	jest.mocked(useJourneyPractice).mockReturnValue({
		session,
		practice: {
			id: 'Movement',
			title: 'Movement',
			description: '',
			completion,
		},
		completion,
		loading: false,
		isSaving: false,
		error: null,
		complete,
		refresh,
	});
});
afterEach(() => act(() => renderer?.unmount()));

it.each(setupPractices)(
	'opens $name from its existing entry point and completes without input',
	async (definition) => {
		mockPracticeId = definition.practiceId;
		const href = getPracticeHref('journey', 12, definition.practiceId);
		expect(href).toEqual({
			pathname:
				'/journeys/[journeyId]/days/[dayNumber]/practices/[practiceId]',
			params: {
				journeyId: 'journey',
				dayNumber: '12',
				practiceId: definition.practiceId,
			},
		});
		jest.mocked(useJourneyPractice).mockReturnValue({
			...jest.mocked(useJourneyPractice)(null),
			practice: {
				id: definition.practiceId,
				title: definition.name,
				description: definition.purpose,
				completion,
			},
		});
		await render();
		expect(useJourneyPractice).toHaveBeenLastCalledWith({
			journeyId: 'journey',
			dayNumber: 12,
			practiceId: definition.practiceId,
		});
		expect(textOf(renderer.root)).toContain(definition.name);
		expect(textOf(renderer.root)).toContain('Begin here');
		expect(complete).not.toHaveBeenCalled();
		expect(button('Mark complete').props['disabled']).toBe(false);
		await act(async () => button('Mark complete').props['onPress']());
		expect(complete).toHaveBeenCalledTimes(1);
	},
);

it.each([
	{ loading: true },
	{ isSaving: true },
	{ error: 'Unable to confirm completion.' },
	{ completion: { ...completion, status: 'Complete' as const } },
])('disables completion for %j', async (state) => {
	jest.mocked(useJourneyPractice).mockReturnValue({
		...jest.mocked(useJourneyPractice)(null),
		...state,
	});
	await render();
	expect(
		button(state.completion ? 'Completed' : 'Mark complete').props[
			'disabled'
		],
	).toBe(true);
});
it.each(['Pray', 'unknown', ['Movement']])(
	'rejects invalid chosen-practice route %s',
	async (id) => {
		mockPracticeId = id;
		await render();
		expect(useJourneyPractice).toHaveBeenLastCalledWith(null);
		expect(textOf(renderer.root)).toContain(
			'This practice link isn’t available.',
		);
		expect(
			renderer.root.findAll((node) => node.type === 'button'),
		).toHaveLength(0);
	},
);
it('offers refresh without exposing unavailable practice content', async () => {
	jest.mocked(useJourneyPractice).mockReturnValue({
		...jest.mocked(useJourneyPractice)(null),
		session: null,
		practice: undefined,
		error: 'Unable to load this practice.',
	});
	await render();
	expect(textOf(renderer.root)).not.toContain('Begin here');
	await act(async () => button('Refresh practice').props['onPress']());
	expect(refresh).toHaveBeenCalledTimes(1);
	expect(complete).not.toHaveBeenCalled();
});
it('opens household Scripture for the routed day without completing either practice', async () => {
	mockPracticeId = 'FamilyOrHouseholdDevotion';
	await render();
	expect(textOf(renderer.root)).toContain('John 15:1–5');
	await act(async () => button('Open assigned Scripture').props['onPress']());
	expect(mockPush).toHaveBeenCalledWith({
		pathname: '/journeys/[journeyId]/days/[dayNumber]/scripture',
		params: { journeyId: 'journey', dayNumber: '12' },
	});
	expect(complete).not.toHaveBeenCalled();
});

it('opens an unselected practice preview using authorized day access and never saves completion', async () => {
	mockPracticeId = 'IntentionalWitness';
	mockPreview = '1';
	await render();
	expect(useJourneyPractice).toHaveBeenLastCalledWith({
		journeyId: 'journey',
		dayNumber: 12,
		practiceId: 'ReadScripture',
	});
	expect(textOf(renderer.root)).toContain('Intentional Witness');
	expect(textOf(renderer.root)).toContain('Practice preview');
	expect(button('Preview only').props['disabled']).toBe(true);
	await act(async () => button('Preview only').props['onPress']());
	expect(complete).not.toHaveBeenCalled();
});
