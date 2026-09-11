import { StyledActionRow } from '@td/components/ui/action-row/action-row.styles';
import { createElement } from 'react';
import { Modal } from 'react-native';
import {
	act,
	create,
	type ReactTestInstance,
	type ReactTestRenderer,
} from 'react-test-renderer';
import type { IJourneyDaySession } from '../journey-day-session.types';
import { useJourneyPractice } from '../use-journey-practice.hook';
import { prayerPrompts } from './prayer-prompts';
import { PrayerScreen } from './prayer.screen';

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
jest.mock('react-native', () => ({ Modal: 'modal' }));
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

jest.mock('@td/assets/icons/prayer/chevron.svg', () => 'svg');
jest.mock('@td/assets/icons/prayer/heart.svg', () => 'svg');
jest.mock('@td/assets/icons/prayer/leaf.svg', () => 'svg');
jest.mock('@td/assets/icons/prayer/rest.svg', () => 'svg');
jest.mock('@td/assets/icons/prayer/x.svg', () => 'svg');
jest.mock('@td/assets/icons/regular/users.svg', () => 'svg');
jest.mock('@td/assets/images/prayer-olive-branch.png', () => 1);
jest.mock('@td/components/ui/action-row/action-row.styles', () => ({
	StyledActionRow: 'row',
}));
jest.mock('./prayer.styles', () => ({
	PrayerBanner: 'image',
	PrayerColumn: 'column',
	PrayerIntro: 'intro',
	PromptList: 'list',
	PromptText: 'text',
	IconCircle: 'circle',
	ModalRoot: 'root',
	ModalBackdrop: 'backdrop',
	ModalCard: 'card',
	ModalHeader: 'header',
	ModalBody: 'body',
}));
const session = {
	day: { journeyId: 'journey', dayNumber: 1 },
} as IJourneyDaySession;
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
		renderer = create(createElement(PrayerScreen));
	});
});
afterEach(() => act(() => renderer.unmount()));

it('opens each distinct prayer and closes without completing the practice', async () => {
	for (const [index, prompt] of prayerPrompts.entries()) {
		await act(async () =>
			renderer.root
				.findAllByType(StyledActionRow)
				[index]!.props['onPress'](),
		);
		const modal = renderer.root.findByType(Modal);
		expect(textOf(modal)).toContain(prompt.prompt);
		expect(textOf(modal)).toContain(prompt.prayer);
		await press('Close prayer');
		expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
	}
	expect(complete).not.toHaveBeenCalled();
	await press('Complete Prayer');
	expect(complete).toHaveBeenCalledTimes(1);
});
it('supports the system back dismissal without completing', async () => {
	await act(async () =>
		renderer.root.findAllByType(StyledActionRow)[0]!.props['onPress'](),
	);
	await act(async () =>
		renderer.root.findByType(Modal).props['onRequestClose'](),
	);
	expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
	expect(complete).not.toHaveBeenCalled();
});
