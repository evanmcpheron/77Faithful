import { HeaderTopRow } from '@td/components/ui/main-header/components/header-top-row/header-top-row.component';
import { createElement } from 'react';
import { Share } from 'react-native';
import {
	act,
	create,
	type ReactTestInstance,
	type ReactTestRenderer,
} from 'react-test-renderer';
import JourneyLayout from '../../../../app/(app)/(tabs)/(journey)/_layout';
import source from '../../../../content/provisional-course/scripture-web.json';
import type { IJourneyDaySession } from '../journey-day-session.types';
import { useJourneyPractice } from '../use-journey-practice.hook';
import { ScriptureScreen } from './scripture.screen';
import { VerseRow } from './scripture.styles';

jest.mock('@td/assets/icons/reading/book-open.svg', () => 'svg');
jest.mock('@td/assets/icons/reading/share.svg', () => 'svg');
jest.mock('@td/components/ui/icon-button/icon-button.styles', () => ({
	StyledIconButton: 'button',
}));
jest.mock('@td/assets/images/scripture-leaf.png', () => 1);
jest.mock('../use-journey-practice.hook');
const mockNavigate = jest.fn();
jest.mock(
	'@td/components/ui/main-header/components/header-top-row/header-top-row.component',
	() => ({ HeaderTopRow: 'header' }),
);
jest.mock('expo-router', () => ({
	Stack: Object.assign(
		({ children }: { children: React.ReactNode }) => children,
		{
			Screen: ({
				options,
			}: {
				options: (input: {
					route: { params: { dayNumber: string } };
				}) => { header: () => React.ReactNode };
			}) => options({ route: { params: { dayNumber: '1' } } }).header(),
		},
	),
	useLocalSearchParams: () => ({ journeyId: 'journey', dayNumber: '1' }),
	useRouter: () => ({ navigate: mockNavigate }),
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 100,
}));
jest.mock('react-native', () => ({ Share: { share: jest.fn() } }));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownScrollScreen: 'screen',
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'button',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'card' }));
jest.mock('@td/components/ui/icon-button/icon-button.component', () => ({
	IconButton: 'iconButton',
}));
jest.mock('@td/components/ui/icon/icon.types', () => ({
	IconName: { ArrowLeft: 'left', ArrowRight: 'right' },
}));
jest.mock('@td/components/ui/progress-bar/progress-bar.component', () => ({
	ProgressBar: 'progress',
}));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'text',
}));
jest.mock('./scripture.styles', () => ({
	PassageSection: 'section',
	ReadingActions: 'actions',
	ReadingAction: 'action',
	ReadingColumn: 'column',
	ReadingTitle: 'title',
	ScriptureLeaf: 'img',
	ScriptureQuote: 'card',
	VerseRow: 'verse',
	VerseText: 'verseText',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const session = {
	day: { journeyId: 'journey', dayNumber: 1 },
	content: { devotional: 'Devotional content' },
	scriptureReference: 'John 15:1–11',
	translation: { abbreviation: 'WEB' },
	acknowledgments: source.acknowledgments,
	scripture: {
		scriptureAssignmentId: 'assignment',
		bibleVersionId: 'Web',
		bibleTextEditionId: `web-${source.sourceRevision.slice(7, 23)}`,
		primaryPassage: {
			passageId: 'assigned',
			displayReference: 'John 15:1–11',
			paragraphs: [{ runs: source.readings['John 15:1–11'] }],
			versificationNote: null,
		},
		supportingPassage: null,
	},
} as unknown as IJourneyDaySession;
let renderer: ReactTestRenderer;
const complete = jest.fn();
const textOf = (node: ReactTestInstance): string =>
	node.children
		.map((child): string =>
			typeof child === 'string' ? child : textOf(child),
		)
		.join('');
const button = (label: string) =>
	renderer.root.find(
		(node) =>
			node.type === 'button' &&
			(textOf(node) === label ||
				node.props['accessibilityLabel'] === label),
	);
const press = async (label: string) => {
	await act(async () => button(label).props['onPress']());
};
beforeEach(async () => {
	jest.clearAllMocks();
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
	await act(async () => {
		renderer = create(createElement(ScriptureScreen));
	});
});
afterEach(() => act(() => renderer.unmount()));
it('toggles only the reading and label, highlights assigned verses, and restores the passage', async () => {
	const initial = textOf(renderer.root);
	expect(renderer.root.findAllByType(VerseRow)).toHaveLength(11);
	await press('Read whole chapter');
	expect(renderer.root.findAllByType(VerseRow)).toHaveLength(27);
	expect(
		renderer.root.findAll(
			(node) => node.props['testID'] === 'assigned-verse-highlight',
		),
	).toHaveLength(11);
	expect(textOf(renderer.root)).toContain('John 15:1–11');
	expect(textOf(renderer.root)).not.toContain('Devotional content');
	expect(textOf(renderer.root)).not.toContain(
		'Scripture quotations are from',
	);
	expect(complete).not.toHaveBeenCalled();
	await press('Show assigned passage');
	expect(textOf(renderer.root)).toBe(initial);
});
it('shares only the assigned passage and reference even while viewing the full chapter', async () => {
	await press('Share');
	const original = jest.mocked(Share.share).mock.calls[0]?.[0];
	await press('Read whole chapter');
	await press('Share');
	expect(jest.mocked(Share.share).mock.calls[1]?.[0]).toEqual(original);
	expect(original?.message).not.toContain(source.acknowledgments[0]);
	expect(original?.message).toContain('John 15:1–11 (WEB)');
	expect(original?.message).not.toContain('Devotional content');
	expect(complete).not.toHaveBeenCalled();
});
it('keeps completion an explicit action', async () => {
	await press('Complete reading');
	expect(complete).toHaveBeenCalledTimes(1);
});

it('the Scripture route reuses the shared back header and returns to Today', async () => {
	await act(async () => renderer.update(createElement(JourneyLayout)));
	const header = renderer.root.findByType(HeaderTopRow);
	expect(header.props['canGoBack']).toBe(true);
	expect(header.props['showNotifications']).toBe(false);
	expect(header.props['title']).toBe('1 of 77');
	expect(header.props['progress']).toEqual({ value: 1, max: 77 });
	await act(async () => header.props['onBackPress']());
	expect(mockNavigate).toHaveBeenCalledWith('/today');
	expect(complete).not.toHaveBeenCalled();
});
it('Continue returns a completed reading to the Today tab', async () => {
	const current = jest.mocked(useJourneyPractice).mock.results[0]?.value;
	jest.mocked(useJourneyPractice).mockReturnValue({
		...current,
		completion: {
			status: 'Complete',
			revision: 1,
			updatedAt: { seconds: 1, nanoseconds: 0 },
		},
	});
	await act(async () => renderer.update(createElement(ScriptureScreen)));
	await press('Continue');
	expect(mockNavigate).toHaveBeenCalledWith('/today');
});
