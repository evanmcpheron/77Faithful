import React from 'react';
import { act, create } from 'react-test-renderer';
import { CommunityProgressSummary } from './community-progress-summary';

const mockGetAggregate = jest.fn();
jest.mock('expo-router', () => ({
	useFocusEffect: (callback: () => void | (() => void)) => {
		const React = jest.requireActual('react') as typeof import('react');
		React.useEffect(callback, [callback]);
	},
}));
jest.mock('./community-progress.service', () => ({
	getAggregateProgress: () => mockGetAggregate(),
	progressReason: () => null,
}));
jest.mock('@td/components/ui/button/button.component', () => ({
	TurndownButton: 'Button',
}));
jest.mock('@td/components/ui/card/card.component', () => ({ Card: 'Card' }));
jest.mock('@td/components/ui/typography/typography.component', () => ({
	Typography: 'Text',
}));
jest.mock('react-native', () => ({ View: 'View' }));

const mount = async (enabled = true) => {
	let renderer!: import('react-test-renderer').ReactTestRenderer;
	await act(async () => {
		renderer = create(
			React.createElement(CommunityProgressSummary, {
				communityId: 'group',
				communityJourneyId: 'journey',
				communityName: 'Grace Church',
				enabled,
			}),
		);
	});
	return renderer;
};
beforeEach(() => mockGetAggregate.mockReset());

it('shows suppression as hidden, without fake zero counts', async () => {
	mockGetAggregate.mockResolvedValue({
		status: 'Suppressed',
		progress: null,
		guidance: 'hidden',
	});
	const renderer = await mount();
	const text = JSON.stringify(renderer.toJSON());
	expect(text).toContain('Shared counts are hidden');
	expect(text).not.toContain('Active journeys: 0');
});

it('removes the prior summary when reading is disabled', async () => {
	mockGetAggregate.mockResolvedValue({
		status: 'Available',
		guidance: 'contributors',
		progress: {
			communityId: 'group',
			communityJourneyId: 'journey',
			contributingMemberCount: 5,
			activeJourneyCount: 5,
			completedJourneyCount: 0,
			endedEarlyJourneyCount: 0,
			calculatedAt: { seconds: 1, nanoseconds: 0 },
		},
	});
	const renderer = await mount();
	expect(JSON.stringify(renderer.toJSON())).toContain('Active journeys:');
	await act(async () => {
		renderer.update(
			React.createElement(CommunityProgressSummary, {
				communityId: 'group',
				communityJourneyId: 'journey',
				communityName: 'Grace Church',
				enabled: false,
			}),
		);
	});
	expect(renderer.toJSON()).toBeNull();
});
