import {
	doc,
	getDoc,
	runTransaction,
	serverTimestamp,
} from 'firebase/firestore';
import {
	AccountProfileConflictError,
	ensureAccountProfile,
	loadAccountProfile,
	savePreferredName,
} from './account-profile.service';

jest.mock('@td/services/firebase/firebase.instance', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
	doc: jest.fn(),
	getDoc: jest.fn(),
	runTransaction: jest.fn(),
	serverTimestamp: jest.fn(),
}));

const reference = { path: 'users/account-1' };
const timestamp = { serverTimestamp: true };
const transaction = { get: jest.fn(), set: jest.fn(), update: jest.fn() };
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

const existingProfile = {
	schemaVersion: 1,
	revision: 3,
	preferredName: 'Reader',
};
it('loads only the validated editable profile fields', async () => {
	jest.mocked(getDoc).mockResolvedValue({
		data: () => ({ ...existingProfile, privateExtra: 'excluded' }),
	} as unknown as Awaited<ReturnType<typeof getDoc>>);
	await expect(loadAccountProfile('account-1')).resolves.toEqual({
		revision: 3,
		preferredName: 'Reader',
	});
});
it.each([
	undefined,
	{},
	{ ...existingProfile, revision: -1 },
	{ ...existingProfile, preferredName: 42 },
])('rejects an invalid profile %j', async (data) => {
	jest.mocked(getDoc).mockResolvedValue({
		data: () => data,
	} as unknown as Awaited<ReturnType<typeof getDoc>>);
	await expect(loadAccountProfile('account-1')).rejects.toThrow(
		'could not be read',
	);
});
it.each([
	['  Evan  ', 'Evan'],
	['  ', null],
])('saves normalized name %s with a new revision', async (name, expected) => {
	transaction.get.mockResolvedValue({ data: () => existingProfile });
	await expect(
		savePreferredName('account-1', { preferredName: name, revision: 3 }),
	).resolves.toEqual({ preferredName: expected, revision: 4 });
	expect(transaction.update).toHaveBeenCalledWith(reference, {
		preferredName: expected,
		revision: 4,
		updatedAt: timestamp,
	});
});
it('does not overwrite a name changed on another device', async () => {
	transaction.get.mockResolvedValue({ data: () => existingProfile });
	await expect(
		savePreferredName('account-1', { preferredName: 'New', revision: 2 }),
	).rejects.toBeInstanceOf(AccountProfileConflictError);
	expect(transaction.update).not.toHaveBeenCalled();
});
it('rejects oversized updates without a write', async () => {
	await expect(
		savePreferredName('account-1', {
			preferredName: 'x'.repeat(81),
			revision: 3,
		}),
	).rejects.toThrow('80 characters');
	expect(runTransaction).not.toHaveBeenCalled();
});
