import {
	doc,
	getDoc,
	runTransaction,
	serverTimestamp,
} from 'firebase/firestore';
import { ensureAccountProfile } from './account-profile.service';

jest.mock('@td/services/firebase/firebase.instance', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
	doc: jest.fn(),
	getDoc: jest.fn(),
	runTransaction: jest.fn(),
	serverTimestamp: jest.fn(),
}));

const reference = { path: 'users/account-1' };
const timestamp = { serverTimestamp: true };
const transaction = { get: jest.fn(), set: jest.fn() };
beforeEach(() => {
	jest.resetAllMocks();
	jest.mocked(doc).mockReturnValue(
		reference as unknown as ReturnType<typeof doc>,
	);
	jest.mocked(getDoc).mockResolvedValue({ exists: () => false } as Awaited<
		ReturnType<typeof getDoc>
	>);
	jest.mocked(serverTimestamp).mockReturnValue(
		timestamp as unknown as ReturnType<typeof serverTimestamp>,
	);
	transaction.get.mockResolvedValue({ exists: () => false });
	jest.mocked(runTransaction).mockImplementation(async (_db, update) =>
		update(transaction as unknown as Parameters<typeof update>[0]),
	);
});
it.each([
	['  Reader  ', 'Reader'],
	['', null],
	['   ', null],
	[undefined, null],
] as const)(
	'creates a private profile with preferred name %s',
	async (input, expected) => {
		await ensureAccountProfile('account-1', input);
		expect(doc).toHaveBeenCalledWith({}, 'users', 'account-1');
		expect(transaction.set).toHaveBeenCalledWith(reference, {
			schemaVersion: 1,
			revision: 0,
			preferredName: expected,
			createdAt: timestamp,
			updatedAt: timestamp,
		});
	},
);
it('leaves an existing profile untouched, including cached profiles', async () => {
	jest.mocked(getDoc).mockResolvedValue({ exists: () => true } as Awaited<
		ReturnType<typeof getDoc>
	>);
	await ensureAccountProfile('account-1', 'Replacement');
	expect(runTransaction).not.toHaveBeenCalled();
});
it('does not overwrite a profile created concurrently', async () => {
	transaction.get.mockResolvedValue({ exists: () => true });
	await ensureAccountProfile('account-1', 'Replacement');
	expect(transaction.set).not.toHaveBeenCalled();
});
it('exposes a write failure so the same profile can be retried', async () => {
	jest.mocked(runTransaction).mockRejectedValueOnce(new Error('offline'));
	await expect(ensureAccountProfile('account-1', 'Reader')).rejects.toThrow(
		'offline',
	);
	await ensureAccountProfile('account-1', 'Reader');
	expect(transaction.set).toHaveBeenCalledTimes(1);
});
it('rejects oversized names before accessing Firestore', async () => {
	await expect(
		ensureAccountProfile('account-1', 'x'.repeat(81)),
	).rejects.toThrow('80 characters');
	expect(getDoc).not.toHaveBeenCalled();
});
