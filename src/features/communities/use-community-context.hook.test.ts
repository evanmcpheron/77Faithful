import type { ICommunityContext } from '@td/types/community/community.types';
import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	getCommunityContext,
	getCommunityReaderReason,
} from './community-reader.service';
import { useCommunityContext } from './use-community-context.hook';

let focusEffect: (() => void | (() => void)) | null = null;
jest.mock('expo-router', () => ({
	useFocusEffect: (callback: () => void | (() => void)) => {
		focusEffect = callback;
		const { useEffect: useReactEffect } = jest.requireActual('react');
		useReactEffect(callback, [callback]);
	},
}));
jest.mock('./community-reader.service');
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const context = (userId: string, role: 'Organizer' | 'Member' = 'Member') =>
	({
		community: {
			communityId: 'group',
			name: 'Grace Church',
			purpose: 'Pray together.',
			organizer: { userId: 'owner', displayName: 'Anna' },
			status: 'Active',
		},
		communityRevision: 4,
		membership: {
			communityId: 'group',
			userId,
			displayName: 'Reader',
			role,
			status: 'Active',
		},
		capabilities: {
			canReadMembers: true,
			canCreatePost: true,
			canInviteMembers: false,
			canManageMembers: false,
			canEditCommunity: false,
			canCloseCommunity: false,
			canLeaveCommunity: true,
		},
		activeMemberCount: { value: 2, isExact: true },
	}) satisfies ICommunityContext;

let current: ReturnType<typeof useCommunityContext>;
let renderer: ReactTestRenderer;
const Probe = ({ userId }: { userId: string | null }) => {
	const value = useCommunityContext(userId, 'group');
	useEffect(() => {
		current = value;
	}, [value]);
	return null;
};

beforeEach(() => {
	jest.clearAllMocks();
	focusEffect = null;
	jest.mocked(getCommunityReaderReason).mockReturnValue(null);
});
afterEach(() => {
	act(() => renderer.unmount());
});

it('refetches on focus and removes prior content when permission is lost', async () => {
	jest.mocked(getCommunityContext).mockResolvedValueOnce(context('member'));
	await act(async () => {
		renderer = create(createElement(Probe, { userId: 'member' }));
	});
	expect(current.state.status).toBe('Ready');

	jest.mocked(getCommunityContext).mockRejectedValueOnce({
		details: { reason: 'CommunityUnavailable' },
	});
	jest.mocked(getCommunityReaderReason).mockReturnValueOnce(
		'CommunityUnavailable',
	);
	await act(async () => {
		focusEffect?.();
	});
	expect(getCommunityContext).toHaveBeenCalledTimes(2);
	expect(current.state).toEqual({ status: 'Unavailable' });
});

it('keeps a transport failure retryable and loads again on retry', async () => {
	jest.mocked(getCommunityContext)
		.mockRejectedValueOnce(new Error('offline'))
		.mockResolvedValueOnce(context('member'));
	await act(async () => {
		renderer = create(createElement(Probe, { userId: 'member' }));
	});
	expect(current.state).toEqual({ status: 'Error' });
	await act(async () => current.retry());
	expect(current.state.status).toBe('Ready');
});

it('ignores a late result after the account changes during a request', async () => {
	let resolveFirst!: (value: ICommunityContext) => void;
	jest.mocked(getCommunityContext)
		.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveFirst = resolve;
			}),
		)
		.mockResolvedValueOnce(context('other'));
	await act(async () => {
		renderer = create(createElement(Probe, { userId: 'member' }));
	});
	await act(async () => {
		renderer.update(createElement(Probe, { userId: 'other' }));
	});
	await act(async () => resolveFirst(context('member', 'Organizer')));
	expect(current.state).toEqual({
		status: 'Ready',
		context: context('other'),
	});
});
