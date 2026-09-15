import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';
import { createElement, useEffect, type ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
	CommunityInviteIntentProvider,
	useCommunityInviteIntent,
} from './community-invite-intent.provider';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockDeleteItem = jest.fn();
const mockGetInitialUrl = jest.fn();
const mockReplace = jest.fn();
let linkListener: ((event: { url: string }) => void) | undefined;
let appStateListener: ((state: string) => void) | undefined;
let account: IAuthenticatedAccountIdentity | null = null;
let isInitializing = false;
let isProfileReady = true;
let pathname = '/today';
let intentContext: ReturnType<typeof useCommunityInviteIntent>;

jest.mock('expo-secure-store', () => ({
	AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
	isAvailableAsync: jest.fn().mockResolvedValue(true),
	getItemAsync: (...args: unknown[]) => mockGetItem(...args),
	setItemAsync: (...args: unknown[]) => mockSetItem(...args),
	deleteItemAsync: (...args: unknown[]) => mockDeleteItem(...args),
}));
jest.mock('expo-constants', () => ({
	__esModule: true,
	default: { expoConfig: { scheme: 'mobile' } },
}));
jest.mock('expo-linking', () => ({
	addEventListener: (
		_type: string,
		listener: (event: { url: string }) => void,
	) => {
		linkListener = listener;
		return { remove: jest.fn() };
	},
	getInitialURL: (...args: unknown[]) => mockGetInitialUrl(...args),
}));
jest.mock('expo-router', () => ({
	usePathname: () => pathname,
	useRouter: () => ({ replace: mockReplace }),
}));
jest.mock('react-native', () => ({
	AppState: {
		addEventListener: (
			_type: string,
			listener: (state: string) => void,
		) => {
			appStateListener = listener;
			return { remove: jest.fn() };
		},
	},
}));
jest.mock('@td/providers/auth/auth.hook', () => ({
	useAuth: () => ({ account, isInitializing, isProfileReady }),
}));
jest.mock('@td/providers/journey/journey-access.provider', () => ({
	useJourneyAccess: () => ({ isLoading: false, hasError: false }),
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const code = '23456789ABCDEFGHJKMN';
const invitationUrl = `mobile:///communities/join?invitationCode=${code}`;
const verifiedAccount = (userId: string): IAuthenticatedAccountIdentity => ({
	userId,
	contactEmail: 'reader@example.com',
	isEmailConfirmed: true,
});
const Consumer = () => {
	const context = useCommunityInviteIntent();
	useEffect(() => {
		intentContext = context;
	}, [context]);
	return null;
};
const Tree = ({ children }: { children?: ReactNode }) =>
	createElement(CommunityInviteIntentProvider, { children });
let renderer: ReactTestRenderer;
const mount = async () => {
	await act(async () => {
		renderer = create(createElement(Tree, null, createElement(Consumer)));
	});
};
const update = async () => {
	await act(async () => {
		renderer.update(createElement(Tree, null, createElement(Consumer)));
	});
};
const openLink = async () => {
	await act(async () => linkListener?.({ url: invitationUrl }));
};

beforeEach(() => {
	jest.clearAllMocks();
	account = null;
	isInitializing = false;
	isProfileReady = true;
	pathname = '/today';
	linkListener = undefined;
	appStateListener = undefined;
	mockGetItem.mockResolvedValue(null);
	mockGetInitialUrl.mockResolvedValue(null);
	mockSetItem.mockResolvedValue(undefined);
	mockDeleteItem.mockResolvedValue(undefined);
});
afterEach(() => {
	jest.useRealTimers();
	act(() => renderer.unmount());
});

it('continues a signed-out cold link through sign-in and verification to preview', async () => {
	pathname = '/communities/join';
	mockGetInitialUrl.mockResolvedValue(invitationUrl);
	await mount();
	expect(mockReplace).toHaveBeenCalledWith('/');
	expect(intentContext.pendingCode).toBe(code);

	account = { ...verifiedAccount('member'), isEmailConfirmed: false };
	await update();
	await update();
	expect(mockReplace).toHaveBeenCalledWith('/confirm-email');

	account = verifiedAccount('member');
	pathname = '/confirm-email';
	await update();
	expect(mockReplace).toHaveBeenCalledWith('/communities/join');
	expect(mockSetItem).toHaveBeenCalledWith(
		expect.any(String),
		expect.stringContaining('"boundUserId":"member"'),
		expect.any(Object),
	);
});

it('deduplicates the initial URL and matching warm listener event', async () => {
	account = verifiedAccount('member');
	mockGetInitialUrl.mockResolvedValue(invitationUrl);
	await mount();
	await openLink();
	const storedCodes = mockSetItem.mock.calls.filter((call) =>
		String(call[1]).includes(code),
	);
	expect(storedCodes).toHaveLength(1);
	expect(mockReplace).toHaveBeenCalledTimes(1);
	expect(mockReplace).toHaveBeenCalledWith('/communities/join');
});

it('clears an account-bound intent on sign-out or account switch', async () => {
	account = verifiedAccount('first');
	await mount();
	await openLink();
	expect(intentContext.pendingCode).toBe(code);

	account = verifiedAccount('second');
	await update();
	expect(mockDeleteItem).toHaveBeenCalled();
	expect(intentContext.pendingCode).toBeNull();
});

it('clears an account-bound intent on sign-out', async () => {
	account = verifiedAccount('member');
	await mount();
	await openLink();

	account = null;
	await update();
	expect(mockDeleteItem).toHaveBeenCalled();
	expect(intentContext.pendingCode).toBeNull();
});

it('deletes a stale cold-start intent without navigating', async () => {
	const now = Date.now();
	mockGetItem.mockResolvedValue(
		JSON.stringify({
			code,
			receivedAt: now - 1_000,
			expiresAt: now,
			boundUserId: null,
		}),
	);
	await mount();
	expect(mockDeleteItem).toHaveBeenCalled();
	expect(mockReplace).not.toHaveBeenCalled();
});

it('defers a warm link while private writing is open, then continues safely', async () => {
	account = verifiedAccount('member');
	pathname = '/journeys/journey/days/4/reflection';
	await mount();
	await openLink();
	expect(mockReplace).not.toHaveBeenCalled();

	pathname = '/today';
	await update();
	expect(mockReplace).toHaveBeenCalledWith('/communities/join');
});

it('clears the persisted intent on explicit cancellation', async () => {
	account = verifiedAccount('member');
	await mount();
	await openLink();
	await act(async () => intentContext.cancel());
	expect(mockDeleteItem).toHaveBeenCalled();
	expect(intentContext.pendingCode).toBeNull();
});

it('rechecks pending intent expiry when the app resumes', async () => {
	jest.useFakeTimers().setSystemTime(new Date('2026-09-14T12:00:00Z'));
	account = verifiedAccount('member');
	await mount();
	await openLink();
	jest.setSystemTime(new Date('2026-10-15T12:00:00Z'));
	await act(async () => appStateListener?.('active'));
	expect(mockDeleteItem).toHaveBeenCalled();
	expect(intentContext.pendingCode).toBeNull();
});
