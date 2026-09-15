import type { IGetCommunitySafetyReportResult } from '@td/types/community/community-moderation.types';
import { createElement } from 'react';
import { Alert } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	getCommunitySafetyReport,
	reviewCommunityReport,
	safetyReviewReason,
} from '../community-safety-review-detail.service';
import { hasCommunitySafetyReviewerCapability } from '../community-safety-review.service';
import {
	permittedReviewActions,
	ReviewContent,
} from './community-safety-review-detail.screen';

jest.mock('react-native', () => ({
	View: 'View',
	Alert: { alert: jest.fn() },
}));
const mockReplace = jest.fn();
const mockRouter = {
	replace: mockReplace,
	back: jest.fn(),
	canGoBack: () => false,
};
jest.mock('expo-router', () => ({
	useRouter: () => mockRouter,
	useFocusEffect: (callback: () => (() => void) | void) => {
		const React = jest.requireActual('react') as typeof import('react');
		React.useEffect(() => callback(), [callback]);
	},
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('@td/components/form/input/input.component', () => ({
	Input: 'Input',
}));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownScrollScreen: 'Scroll',
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'Button',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'Card' }));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
jest.mock('@td/providers/auth/auth.hook', () => ({ useAuth: jest.fn() }));
jest.mock('@td/providers/header-scroll/use-screen-scroll-offset.hook', () => ({
	useScreenScrollOffset: () => ({
		scrollOffset: { value: 0 },
		handleScrollPositionChange: jest.fn(),
	}),
}));
jest.mock('../community-safety-review-detail.service', () => ({
	createReviewOperationId: jest.fn(),
	getCommunitySafetyReport: jest.fn(),
	reviewCommunityReport: jest.fn(),
	safetyReviewReason: jest.fn(),
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let renderer: ReactTestRenderer;
const button = (testID: string) =>
	renderer.root
		.findAll((node) => String(node.type) === 'Button')
		.find((node) => node.props['testID'] === testID);
const text = () =>
	renderer.root
		.findAll((node) => String(node.type) === 'Text')
		.map((node) => node.children.join(''))
		.join(' ');
const render = async (value: IGetCommunitySafetyReportResult = detail) => {
	jest.mocked(hasCommunitySafetyReviewerCapability).mockResolvedValue(true);
	jest.mocked(getCommunitySafetyReport).mockResolvedValue(value);
	jest.mocked(safetyReviewReason).mockReturnValue(null);
	await act(async () => {
		renderer = create(
			createElement(ReviewContent, {
				userId: 'reviewer',
				reportId: 'report1',
			}),
		);
	});
};
const press = async (testID: string) => {
	const item = button(testID);
	if (!item) throw new Error(`Missing ${testID}`);
	await act(async () => {
		(item.props['onPress'] as () => void)();
	});
};

beforeEach(() => jest.clearAllMocks());
afterEach(() => {
	if (renderer) act(() => renderer.unmount());
});
jest.mock('../community-safety-review.service', () => ({
	hasCommunitySafetyReviewerCapability: jest.fn(),
	isSafetyReviewDenied: jest.fn(),
}));

const detail = {
	reportId: 'report1',
	report: {
		target: { targetType: 'Post', postId: 'post1' },
		review: { status: 'Submitted' },
		evidence: { targetRevision: 1 },
	},
	currentTarget: { status: 'Published', revision: 1 },
} as IGetCommunitySafetyReportResult;

it('offers only actions supported by the current target and review owner', () => {
	expect(permittedReviewActions(detail, 'reviewer')).toEqual([
		'RemoveContent',
		'NoAction',
	]);
	expect(
		permittedReviewActions(
			{
				...detail,
				currentTarget: { status: 'ModeratorRemoved', revision: 2 },
			},
			'reviewer',
		),
	).toEqual(['NoAction']);
	expect(
		permittedReviewActions(
			{
				...detail,
				report: {
					...detail.report,
					target: { targetType: 'Member', userId: 'member' },
				},
				currentTarget: {
					status: 'Active',
					revision: 0,
					role: 'Organizer',
				},
			},
			'reviewer',
		),
	).toEqual(['NoAction']);
	expect(
		permittedReviewActions(
			{
				...detail,
				report: {
					...detail.report,
					target: { targetType: 'Member', userId: 'member' },
				},
				currentTarget: {
					status: 'Active',
					revision: 0,
					role: 'Member',
				},
			},
			'reviewer',
		),
	).toEqual(['RemoveMember', 'NoAction']);
	expect(
		permittedReviewActions(
			{
				...detail,
				report: {
					...detail.report,
					target: { targetType: 'Community' },
				},
				currentTarget: { status: 'Active', revision: 0 },
			},
			'reviewer',
		),
	).toEqual(['CloseCommunity', 'NoAction']);
	expect(
		permittedReviewActions(
			{
				...detail,
				report: {
					...detail.report,
					review: {
						status: 'Resolved',
						moderationActionId: 'action1',
						reviewerUserId: 'reviewer',
						resolvedAt: { seconds: 1, nanoseconds: 0 },
					},
				},
			},
			'reviewer',
		),
	).toEqual([]);
	expect(
		permittedReviewActions(
			{
				...detail,
				report: {
					...detail.report,
					review: {
						status: 'UnderReview',
						reviewerUserId: 'other',
						reviewStartedAt: { seconds: 1, nanoseconds: 0 },
					},
				},
			},
			'reviewer',
		),
	).toEqual([]);
});

it('shows submitted evidence and later content separately and cancellation sends no decision', async () => {
	const value = {
		...detail,
		report: {
			...detail.report,
			revision: 2,
			evidence: { targetRevision: 1, text: 'Submitted copy' },
			explanation: 'Private explanation',
		},
		currentTarget: {
			status: 'Published',
			revision: 2,
			text: 'Later edit',
			textDigest: 'a'.repeat(64),
		},
	} as IGetCommunitySafetyReportResult;
	await render(value);
	expect(text()).toContain('Submitted copy');
	expect(text()).toContain('Later edit');
	expect(text()).toContain('Private explanation');
	await press('review-action-RemoveContent');
	const input = renderer.root.findAll(
		(node) => String(node.type) === 'Input',
	)[0];
	if (!input) throw new Error('Missing explanation input');
	await act(async () => {
		(input.props['onChange'] as (value: string) => void)(
			'Restricted decision',
		);
	});
	await press('confirm-review-decision');
	expect(Alert.alert).toHaveBeenCalled();
	expect(reviewCommunityReport).not.toHaveBeenCalled();
	const options = jest.mocked(Alert.alert).mock.calls[0]?.[2];
	expect(options?.[0]?.text).toBe('Cancel');
});

it('submits reviewed revisions once and refetches after a stale conflict', async () => {
	const value = {
		...detail,
		report: {
			...detail.report,
			revision: 2,
			evidence: { targetRevision: 1 },
		},
		currentTarget: {
			status: 'Published',
			revision: 2,
			text: 'Later edit',
			textDigest: 'a'.repeat(64),
		},
	} as IGetCommunitySafetyReportResult;
	await render(value);
	await press('review-action-NoAction');
	const input = renderer.root.findAll(
		(node) => String(node.type) === 'Input',
	)[0];
	if (!input) throw new Error('Missing explanation input');
	await act(async () => {
		(input.props['onChange'] as (text: string) => void)(
			'Restricted decision',
		);
	});
	jest.mocked(reviewCommunityReport).mockRejectedValueOnce({
		details: { reason: 'RevisionConflict' },
	});
	jest.mocked(safetyReviewReason).mockReturnValue('RevisionConflict');
	await press('confirm-review-decision');
	const options = jest.mocked(Alert.alert).mock.calls[0]?.[2];
	await act(async () => {
		options?.[1]?.onPress?.();
	});
	expect(reviewCommunityReport).toHaveBeenCalledTimes(1);
	expect(reviewCommunityReport).toHaveBeenCalledWith(
		expect.objectContaining({
			expectedRevision: 2,
			expectedTargetRevision: 2,
			reviewedCurrentTextDigest: 'a'.repeat(64),
			requestedAction: 'NoAction',
		}),
	);
	expect(getCommunitySafetyReport).toHaveBeenCalledTimes(2);
	expect(button('confirm-review-decision')).toBeUndefined();
});

it.each([
	[
		'RemoveContent',
		{ targetType: 'Post', postId: 'post1' },
		{ status: 'Published', revision: 1 },
	],
	[
		'RemoveMember',
		{ targetType: 'Member', userId: 'member1' },
		{ status: 'Active', revision: 0, role: 'Member' },
	],
	[
		'CloseCommunity',
		{ targetType: 'Community' },
		{ status: 'Active', revision: 1 },
	],
	[
		'NoAction',
		{ targetType: 'Post', postId: 'post1' },
		{ status: 'Published', revision: 1 },
	],
] as const)(
	'confirms %s and refreshes resolved detail',
	async (requestedAction, target, currentTarget) => {
		const value = {
			...detail,
			report: {
				...detail.report,
				revision: 2,
				target,
				evidence: { targetRevision: currentTarget.revision },
			},
			currentTarget,
		} as IGetCommunitySafetyReportResult;
		await render(value);
		await press(`review-action-${requestedAction}`);
		const input = renderer.root.findAll(
			(node) => String(node.type) === 'Input',
		)[0];
		if (!input) throw new Error('Missing explanation input');
		await act(async () => {
			(input.props['onChange'] as (text: string) => void)(
				'Restricted decision',
			);
		});
		jest.mocked(reviewCommunityReport).mockResolvedValue({
			reportId: 'report1',
			moderationActionId: 'action1',
			status: 'Resolved',
		});
		jest.mocked(getCommunitySafetyReport).mockResolvedValueOnce({
			...value,
			report: {
				...value.report,
				review: {
					status: 'Resolved',
					moderationActionId: 'action1',
					reviewerUserId: 'reviewer',
					resolvedAt: { seconds: 1, nanoseconds: 0 },
				},
			},
		} as IGetCommunitySafetyReportResult);
		await press('confirm-review-decision');
		const options = jest.mocked(Alert.alert).mock.calls[0]?.[2];
		await act(async () => {
			options?.[1]?.onPress?.();
		});
		expect(reviewCommunityReport).toHaveBeenCalledWith(
			expect.objectContaining({
				requestedAction,
				expectedRevision: 2,
				expectedTargetRevision: currentTarget.revision,
				explanation: 'Restricted decision',
			}),
		);
		expect(getCommunitySafetyReport).toHaveBeenCalledTimes(2);
		expect(text()).toContain('already been resolved');
	},
);

it('clears restricted data and returns to Settings after role loss', async () => {
	await render();
	await press('review-action-NoAction');
	const input = renderer.root.findAll(
		(node) => String(node.type) === 'Input',
	)[0];
	if (!input) throw new Error('Missing explanation input');
	await act(async () => {
		(input.props['onChange'] as (text: string) => void)(
			'Restricted decision',
		);
	});
	jest.mocked(hasCommunitySafetyReviewerCapability).mockResolvedValueOnce(
		false,
	);
	await press('confirm-review-decision');
	const options = jest.mocked(Alert.alert).mock.calls[0]?.[2];
	await act(async () => {
		options?.[1]?.onPress?.();
	});
	expect(reviewCommunityReport).not.toHaveBeenCalled();
	expect(mockReplace).toHaveBeenCalledWith('/settings');
	expect(text()).not.toContain('Private explanation');
});
