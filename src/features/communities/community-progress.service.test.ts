import {
	getProgressSharing,
	parseAggregateResult,
	parseSharingResult,
	setProgressSharing,
} from './community-progress.service';

const mockCall = jest.fn();
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('firebase/functions', () => ({
	getFunctions: () => 'functions',
	httpsCallable: (_functions: unknown, name: string) => (request: unknown) =>
		mockCall(name, request),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'operation' }));

const stamp = { seconds: 1, nanoseconds: 0 };

describe('progress response boundary', () => {
	beforeEach(() => mockCall.mockReset());
	it('uses the server choices independently, including Private defaults', () => {
		expect(
			parseSharingResult({
				communityId: 'one',
				communityJourneyId: 'journey',
				individualProgress: { status: 'Private' },
				aggregateProgress: { status: 'Private' },
			}),
		).toEqual({
			communityId: 'one',
			communityJourneyId: 'journey',
			individualProgress: { status: 'Private' },
			aggregateProgress: { status: 'Private' },
		});
		expect(
			parseSharingResult({
				communityId: 'two',
				communityJourneyId: 'journey',
				individualProgress: { status: 'Shared', consentedAt: stamp },
				aggregateProgress: { status: 'Private' },
			}).aggregateProgress.status,
		).toBe('Private');
	});
	it('rejects extra private detail in a response', () => {
		expect(() =>
			parseSharingResult({
				communityId: 'one',
				communityJourneyId: 'journey',
				individualProgress: { status: 'Private' },
				aggregateProgress: { status: 'Private' },
				practiceIds: [],
			}),
		).toThrow();
	});
	it('keeps suppression separate from an available true zero', () => {
		expect(
			parseAggregateResult({
				status: 'Suppressed',
				progress: null,
				guidance: 'hidden',
			}).progress,
		).toBeNull();
		expect(
			parseAggregateResult({
				status: 'Available',
				guidance: 'members',
				progress: {
					communityId: 'one',
					communityJourneyId: 'journey',
					contributingMemberCount: 5,
					activeJourneyCount: 5,
					completedJourneyCount: 0,
					endedEarlyJourneyCount: 0,
					calculatedAt: stamp,
				},
			}).progress?.completedJourneyCount,
		).toBe(0);
	});
	it('sends independent choices and uses only confirmed callable results', async () => {
		mockCall.mockResolvedValueOnce({
			data: {
				communityId: 'one',
				communityJourneyId: 'journey',
				individualProgress: { status: 'Private' },
				aggregateProgress: { status: 'Private' },
			},
		});
		await expect(
			getProgressSharing('one', 'journey'),
		).resolves.toMatchObject({
			individualProgress: { status: 'Private' },
			aggregateProgress: { status: 'Private' },
		});
		mockCall.mockResolvedValueOnce({
			data: {
				communityId: 'one',
				communityJourneyId: 'journey',
				individualProgress: { status: 'Shared', consentedAt: stamp },
				aggregateProgress: { status: 'Private' },
			},
		});
		await expect(
			setProgressSharing({
				communityId: 'one',
				communityJourneyId: 'journey',
				shouldShareIndividualProgress: true,
				shouldContributeToAggregateProgress: false,
				operationId: 'operation',
			}),
		).resolves.toMatchObject({
			individualProgress: { status: 'Shared' },
			aggregateProgress: { status: 'Private' },
		});
		expect(mockCall).toHaveBeenLastCalledWith(
			'setCommunityProgressSharing',
			{
				communityId: 'one',
				communityJourneyId: 'journey',
				shouldShareIndividualProgress: true,
				shouldContributeToAggregateProgress: false,
				operationId: 'operation',
			},
		);
	});
	it('rejects progress returned for another community', async () => {
		mockCall.mockResolvedValueOnce({
			data: {
				communityId: 'two',
				communityJourneyId: 'journey',
				individualProgress: { status: 'Private' },
				aggregateProgress: { status: 'Private' },
			},
		});
		await expect(getProgressSharing('one', 'journey')).rejects.toThrow(
			'Unexpected progress scope.',
		);
	});
});
