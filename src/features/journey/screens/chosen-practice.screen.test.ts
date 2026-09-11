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
jest.mock('react-native-svg', () => ({
	__esModule: true,
	default: 'svg',
	Circle: 'circle',
	Path: 'path',
}));
jest.mock('@td/components/ui/divider/divider.component', () => ({
	Divider: 'divider',
}));
jest.mock('./movement.styles', () => ({
	MovementCopy: 'copy',
	MovementExamplesSection: 'examples',
	MovementIllustrationCircle: 'illustration',
	MovementIntroduction: 'introduction',
	MovementRow: 'row',
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

it('renders the approved Movement copy and accessible completion action', async () => {
	await render();
	const text = textOf(renderer.root);
	expect(text).toContain('Movement');
	expect(text).toContain(
		'Care for the body God has given you through movement that fits your abilities and circumstances.',
	);
	expect(text).toContain(
		'Choose a way to move that fits your abilities and circumstances today. No distance, duration, pace, or intensity is required.',
	);
	expect(text).toContain('Take a walk indoors or outside.');
	expect(text).toContain('Try gentle stretching or seated movement.');
	expect(text).toContain(
		'Choose another activity suited to your abilities and circumstances.',
	);
	expect(button('Mark complete').props['accessibilityLabel']).toBe(
		'Mark Movement complete',
	);
});

it.each([
	{ state: { loading: true }, label: 'Mark complete' },
	{ state: { isSaving: true }, label: 'Marking complete…' },
	{
		state: {
			error: 'We couldn’t confirm completion. Refresh this practice before trying again.',
		},
		label: 'Mark complete',
	},
	{
		state: { completion: { ...completion, status: 'Complete' as const } },
		label: 'Completed',
	},
])('disables Movement completion for $state', async ({ state, label }) => {
	jest.mocked(useJourneyPractice).mockReturnValue({
		...jest.mocked(useJourneyPractice)(null),
		...state,
	});
	await render();
	expect(button(label).props['disabled']).toBe(true);
});

it('uses the approved Movement accessibility copy while saving', async () => {
	jest.mocked(useJourneyPractice).mockReturnValue({
		...jest.mocked(useJourneyPractice)(null),
		isSaving: true,
	});
	await render();
	expect(button('Marking complete…').props['accessibilityLabel']).toBe(
		'Marking Movement complete',
	);
});

it('uses the approved Movement accessibility copy when complete', async () => {
	jest.mocked(useJourneyPractice).mockReturnValue({
		...jest.mocked(useJourneyPractice)(null),
		completion: { ...completion, status: 'Complete' as const },
	});
	await render();
	expect(button('Completed').props['accessibilityLabel']).toBe(
		'Movement completed',
	);
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
		error: 'We couldn’t load this practice. Check your connection and try again.',
	});
	await render();
	expect(textOf(renderer.root)).not.toContain('Begin here');
	const refreshButton = button('Refresh practice');
	expect(refreshButton.props['accessibilityLabel']).toBe(
		'Refresh Movement practice',
	);
	await act(async () => refreshButton.props['onPress']());
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

it('shows the approved Movement preview copy without enabling completion', async () => {
	mockPreview = '1';
	await render();
	expect(useJourneyPractice).toHaveBeenLastCalledWith({
		journeyId: 'journey',
		dayNumber: 12,
		practiceId: 'ReadScripture',
	});
	expect(textOf(renderer.root)).toContain(
		'Practice preview. This does not change your chosen practices.',
	);
	expect(button('Preview only').props['disabled']).toBe(true);
	await act(async () => button('Preview only').props['onPress']());
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
