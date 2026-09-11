import { Card } from '@td/components/ui/card/card.component';
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
jest.mock('@td/components/ui/icon/icon.component', () => ({ AppIcon: 'icon' }));
jest.mock('./household-devotion.styles', () => ({
	HouseholdAction: 'household-action',
	HouseholdCopy: 'household-copy',
	HouseholdExamples: 'household-examples',
	HouseholdIntroduction: 'household-introduction',
	HouseholdNumber: 'household-number',
	HouseholdRow: 'household-row',
	HouseholdRows: 'household-rows',
	HouseholdSections: 'household-sections',
}));
jest.mock('./generosity.styles', () => ({
	GenerosityCopy: 'generosity-copy',
	GenerosityDecoration: 'generosity-decoration',
	GenerosityExamples: 'generosity-examples',
	GenerosityHeading: 'generosity-heading',
	GenerosityIconCircle: 'generosity-icon',
	GenerosityNotice: 'generosity-notice',
	GenerosityRow: 'generosity-row',
	GenerositySections: 'generosity-sections',
}));
jest.mock('./intentional-witness.styles', () => ({
	WitnessAction: 'witness-action',
	WitnessBullet: 'witness-bullet',
	WitnessCopy: 'witness-copy',
	WitnessDecoration: 'witness-decoration',
	WitnessExamples: 'witness-examples',
	WitnessHeading: 'witness-heading',
	WitnessInvitation: 'witness-invitation',
	WitnessRow: 'witness-row',
	WitnessSections: 'witness-sections',
}));
jest.mock('./intentional-discipline.styles', () => ({
	DisciplineAction: 'discipline-action',
	DisciplineCopy: 'discipline-copy',
	DisciplineDecoration: 'discipline-decoration',
	DisciplineExamples: 'discipline-examples',
	DisciplineHeading: 'discipline-heading',
	DisciplineIconCircle: 'discipline-icon',
	DisciplineRow: 'discipline-row',
	DisciplineSections: 'discipline-sections',
}));
jest.mock('./gratitude.styles', () => ({
	GratitudeAction: 'gratitude-action',
	GratitudeCopy: 'gratitude-copy',
	GratitudeExamples: 'gratitude-examples',
	GratitudeHeading: 'gratitude-heading',
	GratitudeIconCircle: 'gratitude-icon',
	GratitudeRow: 'gratitude-row',
	GratitudeSections: 'gratitude-sections',
	gratitudeIconStyles: [],
	gratitudeIconColors: [],
}));
jest.mock('./worship.styles', () => ({
	WorshipAction: 'worship-action',
	WorshipCopy: 'worship-copy',
	WorshipExamples: 'worship-examples',
	WorshipHeading: 'worship-heading',
	WorshipIconCircle: 'worship-icon',
	WorshipIntroduction: 'worship-introduction',
	WorshipRow: 'worship-row',
	WorshipRows: 'worship-rows',
	WorshipSections: 'worship-sections',
	worshipIconStyles: [],
}));
jest.mock('./serve-or-encourage.styles', () => ({
	ServeContent: 'serve-content',
	ServeHeading: 'serve-heading',
	ServeHeadingRule: 'serve-heading-rule',
	ServeExamples: 'serve-examples',
	ServeExampleRow: 'serve-example-row',
	ServeExampleCopy: 'serve-example-copy',
	ServeIconCircle: 'serve-icon-circle',
}));
jest.mock('react-native', () => ({
	useWindowDimensions: () => ({ height: 800, width: 375 }),
}));
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));
jest.mock('./christian-reading.styles', () => ({
	ChristianReadingAction: 'reading-action',
	ChristianReadingCopy: 'reading-copy',
	ChristianReadingHeading: 'reading-heading',
	ChristianReadingIcon: 'reading-icon',
	ChristianReadingRow: 'reading-row',
	ChristianReadingSections: 'reading-sections',
}));
jest.mock('./memorization.styles', () => ({
	MemorizationAction: 'memorization-action',
	MemorizationCopy: 'memorization-copy',
	MemorizationHeading: 'memorization-heading',
	MemorizationIconCircle: 'memorization-icon',
	MemorizationRow: 'memorization-row',
	MemorizationSections: 'memorization-sections',
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
		expect(textOf(renderer.root).replace(/\s+/g, ' ')).toContain(
			definition.name,
		);
		if (definition.practiceId === 'Generosity') {
			expect(textOf(renderer.root)).toContain(
				'Giving to 77Faithful is never expected.',
			);
			expect(textOf(renderer.root).endsWith('Complete')).toBe(true);
		}
		if (
			definition.practiceId !== 'IntentionalWitness' &&
			definition.practiceId !== 'ServeOrEncourage' &&
			definition.practiceId !== 'Generosity' &&
			definition.practiceId !== 'ChristianReading' &&
			definition.practiceId !== 'FamilyOrHouseholdDevotion'
		) {
			expect(textOf(renderer.root)).toContain(
				definition.practiceId === 'ScriptureMemorization' ||
					definition.practiceId === 'IntentionalDiscipline'
					? 'How to begin'
					: 'Begin here',
			);
		}
		expect(complete).not.toHaveBeenCalled();
		const label =
			definition.practiceId === 'IntentionalWitness' ||
			definition.practiceId === 'ChristianReading' ||
			definition.practiceId === 'Generosity' ||
			definition.practiceId === 'Gratitude' ||
			definition.practiceId === 'FamilyOrHouseholdDevotion'
				? 'Complete'
				: 'Mark complete';
		expect(button(label).props['disabled']).toBe(false);
		await act(async () => button(label).props['onPress']());
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
it('shows approved household guidance and completes only the routed practice', async () => {
	mockPracticeId = 'FamilyOrHouseholdDevotion';
	await render();
	expect(useJourneyPractice).toHaveBeenLastCalledWith({
		journeyId: 'journey',
		dayNumber: 12,
		practiceId: 'FamilyOrHouseholdDevotion',
	});
	const text = textOf(renderer.root);
	expect(text).toContain('Family or\nHousehold Devotion');
	expect(text).toContain(
		'Set aside time with your family or household to read Scripture, pray, and seek Jesus together.',
	);
	expect(text).toContain(
		'Begin with a short passage of Scripture. Read it together, talk about what it shows you about God and following Jesus, and pray together.',
	);
	expect(text).toContain(
		'On a shorter day, read a brief passage and pray for one another.',
	);
	expect(text).not.toContain('Begin here');
	expect(text).not.toContain('Open assigned Scripture');
	await act(async () => button('Complete').props['onPress']());
	expect(complete).toHaveBeenCalledTimes(1);
	expect(mockPush).not.toHaveBeenCalled();
});
it('keeps household preview completion disabled', async () => {
	mockPracticeId = 'FamilyOrHouseholdDevotion';
	mockPreview = '1';
	await render();
	expect(button('Preview only').props['disabled']).toBe(true);
	await act(async () => button('Preview only').props['onPress']());
	expect(complete).not.toHaveBeenCalled();
});

it('omits the Movement preview notice without enabling completion', async () => {
	mockPreview = '1';
	await render();
	expect(useJourneyPractice).toHaveBeenLastCalledWith({
		journeyId: 'journey',
		dayNumber: 12,
		practiceId: 'ReadScripture',
	});
	expect(textOf(renderer.root)).not.toContain('Practice preview');
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
	expect(textOf(renderer.root)).not.toContain('Practice preview');
	expect(button('Preview only').props['disabled']).toBe(true);
	await act(async () => button('Preview only').props['onPress']());
	expect(complete).not.toHaveBeenCalled();
});

it('shows the approved service boundaries before the action', async () => {
	mockPracticeId = 'ServeOrEncourage';
	await render();
	const text = textOf(renderer.root);
	expect(text).toContain(
		'Practice the love of Jesus through practical help or sincere encouragement.',
	);
	expect(text).toContain(
		'Notice one person you can serve or encourage today. Choose a simple response that is helpful, sincere, and appropriate for your relationship and circumstances.',
	);
	expect(text).toContain('Help with a task or practical need.');
	expect(text).toContain(
		'Send a thoughtful message or speak an encouraging word.',
	);
	expect(text).toContain(
		'Listen carefully and offer support when it is welcome.',
	);
	expect(text).toContain(
		'Serve in a way that respects consent, privacy, personal safety, and needed relational boundaries. Do not contact someone when doing so would be unsafe or inappropriate.',
	);
	expect(text).not.toContain('No note, name, or proof');
	expect(text.endsWith('Mark complete')).toBe(true);
	expect(text).not.toContain('Begin here');
});

it('keeps the service preview completion action disabled', async () => {
	mockPracticeId = 'ServeOrEncourage';
	mockPreview = '1';
	await render();
	expect(button('Preview only').props['disabled']).toBe(true);
	await act(async () => button('Preview only').props['onPress']());
	expect(complete).not.toHaveBeenCalled();
});

it('keeps memorization completion deliberate and after the guidance', async () => {
	mockPracticeId = 'ScriptureMemorization';
	await render();
	expect(complete).not.toHaveBeenCalled();
	expect(textOf(renderer.root).endsWith('Mark complete')).toBe(true);
	expect(button('Mark complete').props['disabled']).toBe(false);
	await act(async () => button('Mark complete').props['onPress']());
	expect(complete).toHaveBeenCalledTimes(1);
});

it('keeps memorization previews from saving completion', async () => {
	mockPracticeId = 'ScriptureMemorization';
	mockPreview = '1';
	await render();
	expect(textOf(renderer.root)).toContain('Scripture Memorization');
	expect(button('Preview only').props['disabled']).toBe(true);
	await act(async () => button('Preview only').props['onPress']());
	expect(complete).not.toHaveBeenCalled();
});

it('opens Christian Reading with its approved guidance cards and completion action', async () => {
	mockPracticeId = 'ChristianReading';
	await render();
	const text = textOf(renderer.root);
	expect(text).toContain('Ways to practice');
	expect(text).toContain('For example');
	expect(text).not.toContain('Begin here');
	expect(text).toContain('There is no required page count or reading time.');
	expect(renderer.root.findAllByType(Card)).toHaveLength(2);
	expect(button('Complete').props['disabled']).toBe(false);
	await act(async () => button('Complete').props['onPress']());
	expect(complete).toHaveBeenCalledTimes(1);
});

it('shows Witness guidance and boundaries before manually completing the practice', async () => {
	mockPracticeId = 'IntentionalWitness';
	await render();
	const text = textOf(renderer.root);
	expect(text).toContain(
		'Share your faith in Jesus through respectful words and conduct.',
	);
	expect(text).toContain('Their response does not determine completion.');
	expect(text).toContain(
		'A particular response from the other person is not required for completion.',
	);
	expect(text.endsWith('Complete')).toBe(true);
	expect(complete).not.toHaveBeenCalled();
	await act(async () => button('Complete').props['onPress']());
	expect(complete).toHaveBeenCalledTimes(1);
});
