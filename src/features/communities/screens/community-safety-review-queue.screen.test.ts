import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CommunitySafetyReviewQueueContent } from './community-safety-review-queue.screen';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRouter = { replace: mockReplace, push: mockPush };
const mockAllowed = jest.fn();
const mockList = jest.fn();
let renderer: ReactTestRenderer;
let focusCleanup: (() => void) | void;

jest.mock('expo-router', () => ({
	useRouter: () => mockRouter,
	useFocusEffect: (callback: () => (() => void) | void) => {
		const React = jest.requireActual('react') as typeof import('react');
		React.useEffect(() => {
			focusCleanup = callback();
			return () => {
				focusCleanup?.();
			};
		}, [callback]);
	},
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('react-native', () => ({ View: 'View' }));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({ account: { userId: 'reviewer' } }),
}));
jest.mock('@td/providers/header-scroll/use-screen-scroll-offset.hook', () => ({
	useScreenScrollOffset: () => ({
		scrollOffset: { value: 0 },
		handleScrollPositionChange: jest.fn(),
	}),
}));
jest.mock('../community-safety-review.service', () => ({
	hasCommunitySafetyReviewerCapability: (...args: unknown[]) =>
		mockAllowed(...args),
	listCommunitySafetyReports: (...args: unknown[]) => mockList(...args),
	isSafetyReviewDenied: (error: { code?: string }) =>
		error.code === 'functions/permission-denied',
}));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownListScreen: ({
		data,
		renderItem,
		ListHeaderComponent,
		ListFooterComponent,
	}: {
		data: unknown[];
		renderItem: (args: { item: unknown }) => React.ReactNode;
		ListHeaderComponent: React.ReactNode;
		ListFooterComponent: React.ReactNode;
	}) => {
		const React = jest.requireActual('react') as typeof import('react');
		return React.createElement(
			'List',
			{},
			ListHeaderComponent,
			...data.map((item) => renderItem({ item })),
			ListFooterComponent,
		);
	},
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'Button',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'Card' }));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const report = {
	reportId: 'r1',
	communityId: 'c1',
	reporterUserId: 'u1',
	target: { targetType: 'Post', postId: 'p1' },
	reason: 'Harassment',
	status: 'Submitted',
	revision: 0,
	createdAt: { seconds: 1_700_000_000, nanoseconds: 0 },
	explanation: 'private evidence must not render',
};
const text = () =>
	renderer.root
		.findAll((node) => String(node.type) === 'Text')
		.map((node) => node.children.join(''))
		.join(' ');
const press = async (testID: string) => {
	const button = renderer.root
		.findAll((node) => String(node.type) === 'Button')
		.find((node) => node.props['testID'] === testID);
	if (!button) throw new Error(`Missing ${testID}`);
	await act(async () => {
		(button.props['onPress'] as () => void)();
	});
};

beforeEach(() => {
	jest.clearAllMocks();
	mockAllowed.mockResolvedValue(true);
	mockList.mockResolvedValue({ reports: [], nextCursor: null });
});
afterEach(() => {
	if (renderer) act(() => renderer.unmount());
});

it('shows an empty queue and paginates safe summaries without evidence', async () => {
	mockList
		.mockResolvedValueOnce({ reports: [report], nextCursor: 'r1' })
		.mockResolvedValueOnce({
			reports: [{ ...report, reportId: 'r2' }],
			nextCursor: null,
		});
	await act(async () => {
		renderer = create(
			createElement(CommunitySafetyReviewQueueContent, {
				userId: 'reviewer',
			}),
		);
	});
	expect(text()).toContain('Post report');
	expect(text()).not.toContain('private evidence');
	await press('open-safety-report-r1');
	expect(mockPush).toHaveBeenCalledWith('/safety-reports/r1');
	await press('load-more-safety-reports');
	expect(
		renderer.root.findAll((node) => String(node.type) === 'Card'),
	).toHaveLength(2);
	await press('refresh-safety-reports');
	expect(text()).toContain('No reports are waiting for review.');
});

it('keeps current rows on failed refresh and clears them on server revocation', async () => {
	mockList
		.mockResolvedValueOnce({ reports: [report], nextCursor: null })
		.mockRejectedValueOnce(new Error('network'))
		.mockRejectedValueOnce({ code: 'functions/permission-denied' });
	await act(async () => {
		renderer = create(
			createElement(CommunitySafetyReviewQueueContent, {
				userId: 'reviewer',
			}),
		);
	});
	await press('refresh-safety-reports');
	expect(
		renderer.root.findAll((node) => String(node.type) === 'Card'),
	).toHaveLength(1);
	expect(text()).toContain('Could not refresh reports');
	await press('refresh-safety-reports');
	expect(
		renderer.root.findAll((node) => String(node.type) === 'Card'),
	).toHaveLength(0);
	expect(mockReplace).toHaveBeenCalledWith('/settings');
});

it('discards a pending page after the account changes', async () => {
	let resolvePage!: (value: { reports: unknown[]; nextCursor: null }) => void;
	mockList.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				resolvePage = resolve;
			}),
	);
	await act(async () => {
		renderer = create(
			createElement(CommunitySafetyReviewQueueContent, {
				userId: 'reviewer',
			}),
		);
	});
	await act(async () => {
		renderer.update(
			createElement(CommunitySafetyReviewQueueContent, {
				userId: 'another',
			}),
		);
	});
	await act(async () => {
		resolvePage({ reports: [report], nextCursor: null });
	});
	expect(
		renderer.root.findAll((node) => String(node.type) === 'Card'),
	).toHaveLength(0);
});
