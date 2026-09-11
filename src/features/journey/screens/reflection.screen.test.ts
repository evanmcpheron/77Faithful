import { createElement } from 'react';
import {
	act,
	create,
	type ReactTestInstance,
	type ReactTestRenderer,
} from 'react-test-renderer';
import type { IJourneyDaySession } from '../journey-day-session.types';
import { saveJourneyReflection } from '../journey-reflection.service';
import { useJourneyPractice } from '../use-journey-practice.hook';
import { ReflectionScreen } from './reflection.screen';
import { ReflectionInput } from './reflection.styles';

jest.mock('../use-journey-practice.hook');
jest.mock('../journey-reflection.service');
jest.mock('@td/assets/icons/prayer/leaf.svg', () => 'svg');
jest.mock('@td/assets/icons/reading/book-open.svg', () => 'svg');
jest.mock('@td/assets/icons/regular/lock.svg', () => 'svg');
jest.mock('@td/assets/images/scripture-leaf.png', () => 1);
jest.mock('expo-router', () => ({
	useLocalSearchParams: () => ({ journeyId: 'journey', dayNumber: '1' }),
	useFocusEffect: (callback: () => void) => {
		const { useEffect } = jest.requireActual('react');
		useEffect(callback, [callback]);
	},
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
jest.mock('./prayer.styles', () => ({}));
jest.mock('./scripture.styles', () => ({ ScriptureLeaf: 'image' }));
jest.mock('./reflection.styles', () => ({
	ReflectionField: 'field',
	ReflectionPrivacy: 'privacy',
	ReflectionPrivacyText: 'privacyText',
	ReflectionColumn: 'column',
	ReflectionIntro: 'intro',
	ReflectionRow: 'row',
	ReflectionText: 'text',
	ReflectionIcon: 'icon',
	ReflectionInput: 'input',
	ReflectionActions: 'actions',
	ReflectionAction: 'action',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const session = {
	day: {
		userId: 'owner',
		journeyId: 'journey',
		dayNumber: 1,
		reflection: null,
	},
	content: {
		reflectionQuestion: 'Where do you need to depend on Jesus today?',
		intentionInvitation: 'Bring one concern to Him.',
	},
} as IJourneyDaySession;
let renderer: ReactTestRenderer;
const complete = jest.fn();
const textOf = (node: ReactTestInstance): string =>
	node.children
		.map((child) => (typeof child === 'string' ? child : textOf(child)))
		.join('');
const button = (label: string) =>
	renderer.root.find(
		(node) => node.type === 'button' && textOf(node) === label,
	);
const press = async (label: string) => {
	await act(async () => button(label).props['onPress']());
};
const write = async (text: string) => {
	await act(async () =>
		renderer.root.findByType(ReflectionInput).props['onChangeText'](text),
	);
};
beforeEach(async () => {
	jest.resetAllMocks();
	jest.mocked(useJourneyPractice).mockReturnValue({
		session,
		practice: undefined,
		completion: { status: 'NotMarked', revision: 0, updatedAt: null },
		loading: false,
		isSaving: false,
		error: null,
		refresh: jest.fn(),
		complete,
	});
	jest.mocked(saveJourneyReflection).mockImplementation(async (input) => ({
		savedRevisionId: 'revision-1',
		currentWriting: {
			revisionId: 'revision-1',
			text: input.text,
			updatedAt: { seconds: 1, nanoseconds: 0 },
		},
		conflictId: null,
	}));
	await act(async () => {
		renderer = create(createElement(ReflectionScreen));
	});
});
afterEach(() => act(() => renderer.unmount()));
it('uses the assigned content and saves a draft without completing', async () => {
	expect(textOf(renderer.root)).toContain(session.content.reflectionQuestion);
	expect(textOf(renderer.root)).toContain('Bring one concern to Him.');
	await write('Help me depend on You.');
	await press('Save draft');
	expect(saveJourneyReflection).toHaveBeenCalledWith({
		target: { kind: 'DailyReflection', journeyId: 'journey', dayNumber: 1 },
		expectedRevisionId: null,
		text: 'Help me depend on You.',
	});
	expect(complete).not.toHaveBeenCalled();
	expect(textOf(renderer.root)).toContain(
		'Your draft is saved to your account.',
	);
	await write('Help me listen, too.');
	await press('Complete');
	expect(saveJourneyReflection).toHaveBeenLastCalledWith(
		expect.objectContaining({
			expectedRevisionId: 'revision-1',
			text: 'Help me listen, too.',
		}),
	);
	expect(complete).toHaveBeenCalledTimes(1);
});
it('retains writing and does not complete after a failed save', async () => {
	jest.mocked(saveJourneyReflection).mockRejectedValue(new Error('offline'));
	await write('My private thoughts');
	await press('Complete');
	expect(renderer.root.findByType(ReflectionInput).props['value']).toBe(
		'My private thoughts',
	);
	expect(complete).not.toHaveBeenCalled();
	expect(textOf(renderer.root)).toContain('We couldn’t confirm');
});
it('waits for the draft save before completing', async () => {
	let resolve!: (
		result: Awaited<ReturnType<typeof saveJourneyReflection>>,
	) => void;
	jest.mocked(saveJourneyReflection).mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	await write('A prayerful reflection');
	await press('Complete');
	expect(complete).not.toHaveBeenCalled();
	expect(button('Complete').props['disabled']).toBe(true);
	await act(async () =>
		resolve({
			savedRevisionId: 'saved',
			currentWriting: {
				revisionId: 'saved',
				text: 'A prayerful reflection',
				updatedAt: { seconds: 1, nanoseconds: 0 },
			},
			conflictId: null,
		}),
	);
	expect(complete).toHaveBeenCalledTimes(1);
});
it('allows quiet reflection without requiring written words', async () => {
	await press('Complete');
	expect(saveJourneyReflection).not.toHaveBeenCalled();
	expect(complete).toHaveBeenCalledTimes(1);
	expect(textOf(renderer.root)).not.toContain('Continue');
});
