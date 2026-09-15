import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { saveJourneySetupChoicesOnly } from './journey-setup.service';

jest.mock('@td/services/firebase/firebase.instance', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
	doc: jest.fn().mockReturnValue({ path: 'private-setup' }),
	runTransaction: jest.fn(),
	serverTimestamp: jest.fn().mockReturnValue('server-time'),
}));

it('changes only the private setup choices and preserves motivation exactly', async () => {
	const writing = {
		revisionId: 'writing-1',
		text: '  Exact private words  ',
		updatedAt: { seconds: 1, nanoseconds: 0 },
	};
	const existing = {
		userId: 'owner',
		revision: 8,
		startingMotivation: writing,
		createdAt: { seconds: 1, nanoseconds: 0 },
	};
	const transaction = {
		get: jest.fn().mockResolvedValue({ data: () => existing }),
		set: jest.fn(),
	};
	jest.mocked(runTransaction).mockImplementation(async (_db, update) =>
		update(transaction as never),
	);
	const choices = {
		readiness: 'ReadyForReview' as const,
		optionalPracticeIds: ['Movement', 'Gratitude'] as const,
		bibleVersionId: 'Web' as const,
	};
	await saveJourneySetupChoicesOnly({
		userId: 'owner',
		expectedRevision: 8,
		choices,
	});
	expect(doc).toHaveBeenCalledWith(
		expect.anything(),
		'users',
		'owner',
		'journeySetupDrafts',
		'current',
	);
	expect(transaction.set).toHaveBeenCalledWith(
		expect.anything(),
		expect.objectContaining({
			revision: 9,
			choices,
			startingMotivation: writing,
		}),
	);
	expect(transaction.set).toHaveBeenCalledTimes(1);
	expect(serverTimestamp).toHaveBeenCalledTimes(1);
});

it('refuses a stale revision without writing', async () => {
	const transaction = {
		get: jest.fn().mockResolvedValue({
			data: () => ({ userId: 'owner', revision: 9 }),
		}),
		set: jest.fn(),
	};
	jest.mocked(runTransaction).mockImplementation(async (_db, update) =>
		update(transaction as never),
	);
	await expect(
		saveJourneySetupChoicesOnly({
			userId: 'owner',
			expectedRevision: 8,
			choices: {
				readiness: 'Incomplete',
				optionalPracticeIds: [],
				bibleVersionId: null,
			},
		}),
	).rejects.toThrow('changed');
	expect(transaction.set).not.toHaveBeenCalled();
});
