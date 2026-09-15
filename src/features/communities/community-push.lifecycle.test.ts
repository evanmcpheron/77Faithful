import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { CommunityPushLifecycle } from './community-push.lifecycle';

const mockOpen = jest.fn();
const mockPush = jest.fn();
const mockResponseListener = jest.fn();
const mockTokenListener = jest.fn();
const mockReceivedListener = jest.fn();
const mockLastResponse = jest.fn();
const mockClearResponse = jest.fn();
const mockAppListener = jest.fn();
let pendingInviteCode: string | null = null;
const mockAuthState: {
	account: { userId: string; isEmailConfirmed: boolean } | null;
	isInitializing: boolean;
	isProfileReady: boolean;
} = { account: null, isInitializing: true, isProfileReady: false };
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => mockAuthState,
}));
jest.mock('./community-invite-intent.provider', () => ({
	useCommunityInviteIntent: () => ({ pendingCode: pendingInviteCode }),
}));
jest.mock('expo-router', () => ({
	useRouter: () => ({ push: mockPush }),
	useRootNavigationState: () => ({ key: 'root' }),
}));
jest.mock('@td/providers/journey/journey-access.provider', () => ({
	useJourneyAccess: () => ({ isLoading: false, hasError: false }),
}));
jest.mock('react-native', () => ({
	Platform: { OS: 'ios' },
	AppState: {
		addEventListener: (...args: unknown[]) => mockAppListener(...args),
	},
}));
jest.mock('expo-notifications', () => ({
	setNotificationHandler: jest.fn(),
	addNotificationResponseReceivedListener: (...args: unknown[]) =>
		mockResponseListener(...args),
	addPushTokenListener: (...args: unknown[]) => mockTokenListener(...args),
	addNotificationReceivedListener: (...args: unknown[]) =>
		mockReceivedListener(...args),
	getLastNotificationResponseAsync: (...args: unknown[]) =>
		mockLastResponse(...args),
	clearLastNotificationResponseAsync: (...args: unknown[]) =>
		mockClearResponse(...args),
}));
jest.mock('./community-push.service', () => ({
	getCommunityPushPermission: jest.fn(),
	notifyCommunityPushIncoming: jest.fn(),
	openCommunityPush: (...args: unknown[]) => mockOpen(...args),
	readCommunityPushLocalState: () => Promise.resolve(null),
	registerCommunityPush: jest.fn(),
	unregisterCommunityPush: jest.fn(),
}));
const event = (id: string) => ({
	notification: { request: { content: { data: { notificationId: id } } } },
});
beforeEach(() => {
	jest.clearAllMocks();
	mockAuthState.account = null;
	mockAuthState.isInitializing = true;
	mockAuthState.isProfileReady = false;
	pendingInviteCode = null;
	mockResponseListener.mockReturnValue({ remove: jest.fn() });
	mockTokenListener.mockReturnValue({ remove: jest.fn() });
	mockReceivedListener.mockReturnValue({ remove: jest.fn() });
	mockAppListener.mockReturnValue({ remove: jest.fn() });
	mockLastResponse.mockResolvedValue(null);
	mockClearResponse.mockResolvedValue(undefined);
	mockOpen.mockResolvedValue({
		status: 'Unavailable',
		communityId: null,
		postId: null,
		replyId: null,
	});
});
it('holds a push target while an invitation is being handled, then opens it', async () => {
	const id = 'c'.repeat(64);
	pendingInviteCode = '23456-789AB-CDEFG-HJKMN';
	mockAuthState.account = { userId: 'user', isEmailConfirmed: true };
	mockAuthState.isInitializing = false;
	mockAuthState.isProfileReady = true;
	mockLastResponse.mockResolvedValue(event(id));
	mockOpen.mockResolvedValue({
		status: 'Available',
		communityId: 'community',
		postId: 'post',
		replyId: null,
	});
	let root!: TestRenderer.ReactTestRenderer;
	await act(async () => {
		root = TestRenderer.create(React.createElement(CommunityPushLifecycle));
	});
	expect(mockOpen).not.toHaveBeenCalled();
	pendingInviteCode = null;
	await act(async () => {
		root.update(React.createElement(CommunityPushLifecycle));
	});
	expect(mockOpen).toHaveBeenCalledWith(id);
	expect(mockPush).toHaveBeenCalledTimes(1);
	await act(async () => {
		root.unmount();
	});
});
it('installs one listener set and deduplicates a cold-start tap after auth initialization', async () => {
	const id = 'a'.repeat(64);
	mockLastResponse.mockResolvedValue(event(id));
	mockOpen.mockResolvedValue({
		status: 'Available',
		communityId: 'community',
		postId: 'post',
		replyId: null,
	});
	let root!: TestRenderer.ReactTestRenderer;
	await act(async () => {
		root = TestRenderer.create(React.createElement(CommunityPushLifecycle));
	});
	expect(mockOpen).not.toHaveBeenCalled();
	expect(mockResponseListener).toHaveBeenCalledTimes(1);
	mockAuthState.account = { userId: 'user', isEmailConfirmed: true };
	mockAuthState.isInitializing = false;
	mockAuthState.isProfileReady = true;
	await act(async () => {
		root.update(React.createElement(CommunityPushLifecycle));
	});
	expect(mockOpen).toHaveBeenCalledWith(id);
	expect(mockPush).toHaveBeenCalledTimes(1);
	const listener = mockResponseListener.mock.calls[0]?.[0] as (
		value: unknown,
	) => void;
	await act(async () => {
		listener(event(id));
	});
	expect(mockPush).toHaveBeenCalledTimes(1);
	await act(async () => {
		root.unmount();
	});
});
it('refuses an unavailable server-resolved target for an old or wrong account', async () => {
	mockAuthState.account = { userId: 'new-user', isEmailConfirmed: true };
	mockAuthState.isInitializing = false;
	mockAuthState.isProfileReady = true;
	mockLastResponse.mockResolvedValue(event('b'.repeat(64)));
	let root!: TestRenderer.ReactTestRenderer;
	await act(async () => {
		root = TestRenderer.create(React.createElement(CommunityPushLifecycle));
	});
	expect(mockOpen).toHaveBeenCalledTimes(1);
	expect(mockPush).not.toHaveBeenCalled();
	await act(async () => {
		root.unmount();
	});
});
