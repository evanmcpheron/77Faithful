import type { IOrganizerCommunityInvitation } from '@td/types/community/community-invitation.types';
import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	createCommunityInvitationOperationId,
	getCommunityInvitationReason,
	getCurrentCommunityInvitation,
	issueCommunityInvitation,
	revokeCommunityInvitation,
	rotateCommunityInvitation,
} from './community-invitation.service';
import { useCommunityInvitation } from './use-community-invitation.hook';

let focusEffect: (() => void | (() => void)) | null = null;
jest.mock('expo-router', () => ({
	useFocusEffect: (callback: () => void | (() => void)) => {
		focusEffect = callback;
		const { useEffect: useReactEffect } = jest.requireActual('react');
		useReactEffect(callback, [callback]);
	},
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'operation' }));
jest.mock('./community-invitation.service');
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const invitation = (
	invitationId = 'invitation-1',
): IOrganizerCommunityInvitation => ({
	communityId: 'group',
	invitationId,
	code: '23456-789AB-CDEFG-HJKMN',
	expiresAt: { seconds: 1_800_000_000, nanoseconds: 0 },
});

let current: ReturnType<typeof useCommunityInvitation>;
let renderer: ReactTestRenderer;
const Probe = ({
	userId = 'owner',
	canManage = true,
}: {
	userId?: string | null;
	canManage?: boolean;
}) => {
	const value = useCommunityInvitation({
		userId,
		communityId: 'group',
		canManage,
	});
	useEffect(() => {
		current = value;
	}, [value]);
	return null;
};

beforeEach(() => {
	jest.clearAllMocks();
	focusEffect = null;
	jest.mocked(getCommunityInvitationReason).mockReturnValue(null);
	jest.mocked(createCommunityInvitationOperationId).mockReset();
	jest.mocked(createCommunityInvitationOperationId)
		.mockReturnValueOnce('operation-1')
		.mockReturnValueOnce('operation-2')
		.mockReturnValueOnce('operation-3');
});
afterEach(() => act(() => renderer.unmount()));

it('does not silently issue, then generates from the no-code or expired state', async () => {
	jest.mocked(getCurrentCommunityInvitation).mockResolvedValue(null);
	jest.mocked(issueCommunityInvitation).mockResolvedValue(invitation());
	await act(async () => {
		renderer = create(createElement(Probe));
	});
	expect(current.state).toEqual({ status: 'None' });
	expect(issueCommunityInvitation).not.toHaveBeenCalled();
	await act(async () => current.issue());
	expect(issueCommunityInvitation).toHaveBeenCalledWith({
		communityId: 'group',
		operationId: 'operation-1',
	});
	expect(current.state).toEqual({
		status: 'Ready',
		invitation: invitation(),
	});
});

it('retrieves the same active code, then rotates and revokes only explicitly', async () => {
	jest.mocked(getCurrentCommunityInvitation).mockResolvedValue(invitation());
	jest.mocked(rotateCommunityInvitation).mockResolvedValue(
		invitation('invitation-2'),
	);
	jest.mocked(revokeCommunityInvitation).mockResolvedValue({
		communityId: 'group',
		invitationId: 'invitation-2',
		revokedAt: { seconds: 1_700_000_000, nanoseconds: 0 },
	});
	await act(async () => {
		renderer = create(createElement(Probe));
	});
	expect(current.state).toEqual({
		status: 'Ready',
		invitation: invitation(),
	});
	expect(rotateCommunityInvitation).not.toHaveBeenCalled();
	await act(async () => current.rotate());
	expect(current.state).toEqual({
		status: 'Ready',
		invitation: invitation('invitation-2'),
	});
	await act(async () => current.revoke());
	expect(revokeCommunityInvitation).toHaveBeenCalledWith({
		communityId: 'group',
		invitationId: 'invitation-2',
		operationId: 'operation-2',
	});
	expect(current.state).toEqual({ status: 'None' });
});

it('preserves an operation ID after an uncertain mutation and retries it', async () => {
	jest.mocked(getCurrentCommunityInvitation).mockResolvedValue(null);
	jest.mocked(issueCommunityInvitation)
		.mockRejectedValueOnce(new Error('offline'))
		.mockResolvedValueOnce(invitation());
	await act(async () => {
		renderer = create(createElement(Probe));
	});
	await act(async () => current.issue());
	expect(current.mutationMessage).toContain(
		'confirm whether the invitation changed',
	);
	await act(async () => current.issue());
	expect(jest.mocked(issueCommunityInvitation).mock.calls[1]).toEqual(
		jest.mocked(issueCommunityInvitation).mock.calls[0],
	);
});

it('retries an uncertain rotation with the same operation ID', async () => {
	jest.mocked(getCurrentCommunityInvitation).mockResolvedValue(invitation());
	jest.mocked(rotateCommunityInvitation)
		.mockRejectedValueOnce(new Error('offline'))
		.mockResolvedValueOnce(invitation('invitation-2'));
	await act(async () => {
		renderer = create(createElement(Probe));
	});
	await act(async () => current.rotate());
	await act(async () => current.rotate());
	expect(jest.mocked(rotateCommunityInvitation).mock.calls[1]).toEqual(
		jest.mocked(rotateCommunityInvitation).mock.calls[0],
	);
	expect(current.state).toEqual({
		status: 'Ready',
		invitation: invitation('invitation-2'),
	});
});

it('clears a retrieved code when the account changes', async () => {
	let resolveSecond!: (value: IOrganizerCommunityInvitation | null) => void;
	jest.mocked(getCurrentCommunityInvitation)
		.mockResolvedValueOnce(invitation())
		.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveSecond = resolve;
			}),
		);
	await act(async () => {
		renderer = create(createElement(Probe));
	});
	expect(current.state.status).toBe('Ready');
	await act(async () => {
		renderer.update(createElement(Probe, { userId: 'other' }));
	});
	expect(current.state).toEqual({ status: 'Loading' });
	await act(async () => resolveSecond(null));
	expect(current.state).toEqual({ status: 'None' });

	await act(async () => {
		renderer.update(
			createElement(Probe, { userId: 'other', canManage: false }),
		);
	});
	expect(current.state).toEqual({ status: 'Idle' });
});

it('removes the code when organizer permission is revoked during load', async () => {
	jest.mocked(getCurrentCommunityInvitation).mockRejectedValue({
		details: { reason: 'OrganizerRequired' },
	});
	jest.mocked(getCommunityInvitationReason).mockReturnValue(
		'OrganizerRequired',
	);
	await act(async () => {
		renderer = create(createElement(Probe));
	});
	expect(current.state).toEqual({ status: 'Unavailable' });
});

it('reloads a recoverable read failure on retry and focus', async () => {
	jest.mocked(getCurrentCommunityInvitation)
		.mockRejectedValueOnce(new Error('offline'))
		.mockResolvedValue(null);
	await act(async () => {
		renderer = create(createElement(Probe));
	});
	expect(current.state).toEqual({ status: 'Error' });
	await act(async () => current.retry());
	expect(current.state).toEqual({ status: 'None' });
	await act(async () => {
		focusEffect?.();
	});
	expect(getCurrentCommunityInvitation).toHaveBeenCalledTimes(3);
});
