import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	AccountProfileConflictError,
	loadAccountProfile,
	savePreferredName,
} from './account-profile.service';
import { useAccountProfile } from './use-account-profile.hook';

jest.mock('./account-profile.service', () => ({
	AccountProfileConflictError: class extends Error {},
	loadAccountProfile: jest.fn(),
	savePreferredName: jest.fn(),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let current: ReturnType<typeof useAccountProfile>;
let renderer: ReactTestRenderer;
const Consumer = () => {
	const profile = useAccountProfile('owner');
	useEffect(() => {
		current = profile;
	});
	return null;
};
beforeEach(async () => {
	jest.resetAllMocks();
	jest.mocked(loadAccountProfile).mockResolvedValue({
		preferredName: 'Reader',
		revision: 0,
	});
	await act(async () => {
		renderer = create(createElement(Consumer));
	});
});
afterEach(() => act(() => renderer.unmount()));
it('requires a changed valid name and saves an intentionally cleared name', async () => {
	expect(current.canSave).toBe(false);
	act(() => current.changeName('x'.repeat(81)));
	expect(current.canSave).toBe(false);
	await act(async () => current.save());
	expect(savePreferredName).not.toHaveBeenCalled();
	act(() => current.changeName(''));
	jest.mocked(savePreferredName).mockResolvedValue({
		preferredName: null,
		revision: 1,
	});
	await act(async () => current.save());
	expect(savePreferredName).toHaveBeenCalledWith('owner', {
		preferredName: '',
		revision: 0,
	});
	expect(current.saved).toBe(true);
	expect(current.canSave).toBe(false);
});
it('preserves the draft after a failed save and permits retry', async () => {
	act(() => current.changeName('Evan'));
	jest.mocked(savePreferredName).mockRejectedValueOnce(
		new Error('private backend error'),
	);
	await act(async () => current.save());
	expect(current.name).toBe('Evan');
	expect(current.error).not.toContain('private backend error');
	expect(current.canSave).toBe(true);
	expect(current.saved).toBe(false);
});
it('requires deliberate reload after a conflict without silently replacing the draft', async () => {
	act(() => current.changeName('My draft'));
	jest.mocked(savePreferredName).mockRejectedValue(
		new AccountProfileConflictError('Reload your profile.'),
	);
	await act(async () => current.save());
	expect(current.name).toBe('My draft');
	expect(current.canSave).toBe(false);
	expect(current.canReload).toBe(true);
	jest.mocked(loadAccountProfile).mockResolvedValue({
		preferredName: 'Other device',
		revision: 2,
	});
	await act(async () => current.reload());
	expect(current.name).toBe('Other device');
	expect(current.error).toBeNull();
});
it('prevents duplicate writes while a save is pending', async () => {
	act(() => current.changeName('Evan'));
	let finish: (value: {
		preferredName: string;
		revision: number;
	}) => void = () => {};
	jest.mocked(savePreferredName).mockReturnValue(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	let pending: Promise<void>;
	act(() => {
		pending = current.save();
		void current.save();
	});
	expect(savePreferredName).toHaveBeenCalledTimes(1);
	await act(async () => {
		finish({ preferredName: 'Evan', revision: 1 });
		await pending;
	});
	expect(current.saved).toBe(true);
});
