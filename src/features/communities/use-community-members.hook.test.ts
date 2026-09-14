import type { ICommunityMemberSummary } from '@td/types/community/community-membership.types';
import { createElement, useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	getCommunityReaderReason,
	listCommunityMembers,
} from './community-reader.service';
import { useCommunityMembers } from './use-community-members.hook';

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

const member = (userId: string): ICommunityMemberSummary => ({
	communityId: 'group',
	userId,
	displayName: userId,
	role: userId === 'owner' ? 'Organizer' : 'Member',
});
let current: ReturnType<typeof useCommunityMembers>;
let renderer: ReactTestRenderer;
const Probe = ({ userId = 'owner' }: { userId?: string }) => {
	const value = useCommunityMembers(userId, 'group', true);
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
afterEach(() => act(() => renderer.unmount()));

it('loads paginated members, keeps stable unique IDs, and blocks duplicate taps', async () => {
	let resolveMore!: (value: {
		members: ICommunityMemberSummary[];
		nextCursor: string | null;
	}) => void;
	jest.mocked(listCommunityMembers)
		.mockResolvedValueOnce({
			members: [member('owner')],
			nextCursor: 'next',
		})
		.mockReturnValueOnce(new Promise((resolve) => (resolveMore = resolve)));
	await act(async () => {
		renderer = create(createElement(Probe));
	});
	act(() => {
		void current.loadMore();
		void current.loadMore();
	});
	expect(listCommunityMembers).toHaveBeenCalledTimes(2);
	expect(listCommunityMembers).toHaveBeenLastCalledWith({
		communityId: 'group',
		pageSize: 20,
		cursor: 'next',
	});
	await act(async () =>
		resolveMore({
			members: [member('owner'), member('member')],
			nextCursor: null,
		}),
	);
	expect(current.state).toEqual({
		status: 'Ready',
		members: [member('owner'), member('member')],
		nextCursor: null,
		isLoadingMore: false,
		loadMoreError: false,
	});
});

it('keeps load-more failure recoverable without discarding the first page', async () => {
	jest.mocked(listCommunityMembers)
		.mockResolvedValueOnce({
			members: [member('owner')],
			nextCursor: 'next',
		})
		.mockRejectedValueOnce(new Error('offline'));
	await act(async () => {
		renderer = create(createElement(Probe));
	});
	await act(async () => current.loadMore());
	expect(current.state).toEqual(
		expect.objectContaining({
			status: 'Ready',
			members: [member('owner')],
			loadMoreError: true,
		}),
	);
});

it('clears members when access is lost on focus', async () => {
	jest.mocked(listCommunityMembers).mockResolvedValueOnce({
		members: [member('owner')],
		nextCursor: null,
	});
	await act(async () => {
		renderer = create(createElement(Probe));
	});
	jest.mocked(listCommunityMembers).mockRejectedValueOnce({
		details: { reason: 'CommunityUnavailable' },
	});
	jest.mocked(getCommunityReaderReason).mockReturnValueOnce(
		'CommunityUnavailable',
	);
	await act(async () => {
		focusEffect?.();
	});
	expect(current.state).toEqual({ status: 'Unavailable' });
});

it('ignores a late page from the previous account', async () => {
	let resolveFirst!: (value: {
		members: ICommunityMemberSummary[];
		nextCursor: string | null;
	}) => void;
	jest.mocked(listCommunityMembers)
		.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
		.mockResolvedValueOnce({
			members: [member('other')],
			nextCursor: null,
		});
	await act(async () => {
		renderer = create(createElement(Probe));
	});
	await act(async () => {
		renderer.update(createElement(Probe, { userId: 'other' }));
	});
	await act(async () =>
		resolveFirst({ members: [member('owner')], nextCursor: null }),
	);
	expect(current.state).toEqual(
		expect.objectContaining({ members: [member('other')] }),
	);
});
