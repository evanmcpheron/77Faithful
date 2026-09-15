import React from 'react';
import { act, create } from 'react-test-renderer';
import { ProgressSharingScreen } from './progress-sharing.screen';

const mockGetSharing = jest.fn();
const mockSetSharing = jest.fn();
const mockGetSchedule = jest.fn();
const mockGetEnrollment = jest.fn();
let mockUserId = 'person';
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({ account: { userId: mockUserId } }),
}));
jest.mock('@td/providers/header-scroll/use-screen-scroll-offset.hook', () => ({
	useScreenScrollOffset: () => ({
		scrollOffset: { value: 0 },
		handleScrollPositionChange: jest.fn(),
	}),
}));
jest.mock('expo-router/react-navigation', () => ({
	useHeaderHeight: () => 80,
}));
jest.mock('expo-router', () => ({
	useFocusEffect: (callback: () => void | (() => void)) => {
		const React = jest.requireActual('react') as typeof import('react');
		React.useEffect(callback, [callback]);
	},
	useLocalSearchParams: () => ({
		communityId: 'group',
		communityJourneyId: 'journey',
	}),
	useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('../use-community-context.hook', () => ({
	useCommunityContext: () => ({
		state: {
			status: 'Ready',
			context: {
				community: {
					communityId: 'group',
					name: 'Grace Church',
					status: 'Active',
				},
				membership: { communityId: 'group', userId: mockUserId },
			},
		},
		retry: jest.fn(),
	}),
}));
jest.mock('../community-journey-schedule.service', () => ({
	getCommunityJourneySchedule: () => mockGetSchedule(),
	listCommunityJourneyHistory: jest.fn(),
}));
jest.mock('../community-journey-detail.service', () => ({
	getOwnCommunityJourneyEnrollment: () => mockGetEnrollment(),
}));
jest.mock('../community-progress.service', () => ({
	getProgressSharing: () => mockGetSharing(),
	setProgressSharing: (request: unknown) => mockSetSharing(request),
	progressOperationId: () => 'operation',
	progressReason: () => null,
}));
jest.mock('../community-reader.service', () => ({
	listCommunities: jest.fn(),
}));
jest.mock('@td/components/layout/screen/screen.component', () => ({
	TurndownScrollScreen: 'Screen',
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'Button',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'Card' }));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
jest.mock('react-native', () => ({ View: 'View' }));

const privateChoice = {
	communityId: 'group',
	communityJourneyId: 'journey',
	individualProgress: { status: 'Private' },
	aggregateProgress: { status: 'Private' },
};
const mount = async () => {
	let renderer!: import('react-test-renderer').ReactTestRenderer;
	await act(async () => {
		renderer = create(React.createElement(ProgressSharingScreen));
	});
	return renderer;
};
const button = (
	renderer: import('react-test-renderer').ReactTestRenderer,
	label: string,
) =>
	renderer.root.find(
		(node) =>
			String(node.type) === 'Button' && node.props['children'] === label,
	);
beforeEach(() => {
	jest.clearAllMocks();
	mockUserId = 'person';
	mockGetSchedule.mockResolvedValue({
		communityJourney: {
			communityId: 'group',
			communityJourneyId: 'journey',
			status: 'Active',
			startDate: '2026-09-01',
		},
	});
	mockGetEnrollment.mockResolvedValue({
		enrollment: {
			communityId: 'group',
			communityJourneyId: 'journey',
			lifecycle: { status: 'Enrolled' },
		},
	});
	mockGetSharing.mockResolvedValue(privateChoice);
});

it('clears the previous account choices when the account changes', async () => {
	mockGetSharing
		.mockResolvedValueOnce({
			...privateChoice,
			individualProgress: {
				status: 'Shared',
				consentedAt: { seconds: 1, nanoseconds: 0 },
			},
		})
		.mockResolvedValueOnce(privateChoice);
	const renderer = await mount();
	expect(button(renderer, 'Make my stage private')).toBeDefined();
	mockUserId = 'second-person';
	await act(async () => {
		renderer.update(React.createElement(ProgressSharingScreen));
	});
	expect(button(renderer, 'Share my stage')).toBeDefined();
});

it('keeps both controls Private until the server confirms an independent choice', async () => {
	const renderer = await mount();
	expect(button(renderer, 'Share my stage')).toBeDefined();
	expect(button(renderer, 'Contribute to summary')).toBeDefined();
	mockSetSharing.mockResolvedValue({
		...privateChoice,
		individualProgress: {
			status: 'Shared',
			consentedAt: { seconds: 1, nanoseconds: 0 },
		},
	});
	await act(async () => {
		button(renderer, 'Share my stage').props['onPress']();
	});
	expect(mockSetSharing).toHaveBeenCalledWith({
		communityId: 'group',
		communityJourneyId: 'journey',
		shouldShareIndividualProgress: true,
		shouldContributeToAggregateProgress: false,
		operationId: 'operation',
	});
	expect(button(renderer, 'Make my stage private')).toBeDefined();
	expect(button(renderer, 'Contribute to summary')).toBeDefined();
});

it('offers no sharing actions without an eligible enrollment', async () => {
	mockGetEnrollment.mockResolvedValue({ enrollment: null });
	const renderer = await mount();
	expect(
		renderer.root.findAll(
			(node) =>
				String(node.type) === 'Button' &&
				['Share my stage', 'Contribute to summary'].includes(
					node.props['children'],
				),
		),
	).toHaveLength(0);
});

it('keeps an uncertain change unconfirmed and retries the same operation', async () => {
	const renderer = await mount();
	mockSetSharing
		.mockRejectedValueOnce(new Error('connection'))
		.mockResolvedValueOnce(privateChoice);
	await act(async () => {
		button(renderer, 'Share my stage').props['onPress']();
	});
	expect(button(renderer, 'Share my stage').props['disabled']).toBe(true);
	expect(button(renderer, 'Retry same change')).toBeDefined();
	await act(async () => {
		button(renderer, 'Retry same change').props['onPress']();
	});
	expect(mockSetSharing).toHaveBeenCalledTimes(2);
	expect(mockSetSharing.mock.calls[0][0]).toEqual(
		mockSetSharing.mock.calls[1][0],
	);
	expect(button(renderer, 'Share my stage')).toBeDefined();
});

it('shows Private immediately after a confirmed revocation', async () => {
	mockGetSharing.mockResolvedValue({
		...privateChoice,
		individualProgress: {
			status: 'Shared',
			consentedAt: { seconds: 1, nanoseconds: 0 },
		},
	});
	const renderer = await mount();
	mockSetSharing.mockResolvedValue(privateChoice);
	await act(async () => {
		button(renderer, 'Make my stage private').props['onPress']();
	});
	expect(button(renderer, 'Share my stage')).toBeDefined();
	expect(button(renderer, 'Contribute to summary')).toBeDefined();
});

it('offers no controls when no eligible group journey exists', async () => {
	mockGetSchedule.mockResolvedValue({ communityJourney: null });
	const renderer = await mount();
	expect(
		renderer.root.findAll(
			(node) =>
				String(node.type) === 'Button' &&
				['Share my stage', 'Contribute to summary'].includes(
					node.props['children'],
				),
		),
	).toHaveLength(0);
});
