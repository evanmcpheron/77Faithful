import {
	getCommunityPushPermission,
	getCommunityPushProjectId,
	openCommunityPush,
	registerCommunityPush,
	unregisterCommunityPush,
} from './community-push.service';

const mockCall = jest.fn();
const mockCallable = jest.fn();
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDelete = jest.fn();
const mockPermissions = jest.fn();
const mockRequest = jest.fn();
const mockToken = jest.fn();
let stored: string | null = null;
jest.mock('@td/services/firebase/firebase.instance', () => ({ app: {} }));
jest.mock('@td/services/firebase/firebase-auth.instance', () => ({
	auth: { currentUser: { uid: 'user' } },
}));
jest.mock('expo-constants', () => ({
	__esModule: true,
	default: { expoConfig: { extra: { eas: {} } }, easConfig: null },
}));
jest.mock('expo-crypto', () => ({
	getRandomBytes: (length: number) => new Uint8Array(length).fill(1),
	randomUUID: () => 'operation',
}));
jest.mock('expo-secure-store', () => ({
	AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
	isAvailableAsync: () => Promise.resolve(true),
	getItemAsync: (...args: unknown[]) => mockGet(...args),
	setItemAsync: (...args: unknown[]) => mockSet(...args),
	deleteItemAsync: (...args: unknown[]) => mockDelete(...args),
}));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo-notifications', () => ({
	IosAuthorizationStatus: { PROVISIONAL: 3 },
	getPermissionsAsync: (...args: unknown[]) => mockPermissions(...args),
	requestPermissionsAsync: (...args: unknown[]) => mockRequest(...args),
	getExpoPushTokenAsync: (...args: unknown[]) => mockToken(...args),
}));
jest.mock('firebase/functions', () => ({
	getFunctions: () => 'functions',
	httpsCallable: (...args: unknown[]) => mockCallable(...args),
}));
const mockAuth = jest.requireMock(
	'@td/services/firebase/firebase-auth.instance',
).auth as { currentUser: { uid: string } | null };
const mockConfig = jest.requireMock('expo-constants').default as {
	expoConfig: { extra: { eas: { projectId?: string } } };
	easConfig: null;
};

const identity = '01010101010101010101';
const response = (permission: string, enabled: boolean, registered = true) => ({
	data: {
		installationId: identity,
		permission,
		deliveryEnabled: enabled,
		registered,
	},
});
beforeEach(() => {
	jest.clearAllMocks();
	stored = null;
	mockAuth.currentUser = { uid: 'user' };
	mockConfig.expoConfig.extra.eas = {};
	mockGet.mockImplementation(() => Promise.resolve(stored));
	mockSet.mockImplementation((_: string, value: string) => {
		stored = value;
		return Promise.resolve();
	});
	mockDelete.mockImplementation(() => {
		stored = null;
		return Promise.resolve();
	});
	mockPermissions.mockResolvedValue({ granted: false, canAskAgain: true });
	mockRequest.mockResolvedValue({ granted: true });
	mockToken.mockResolvedValue({ data: 'ExpoPushToken[valid]' });
	mockCallable.mockReturnValue(mockCall);
	mockCall.mockImplementation(
		(input: { permission?: string; deliveryEnabled?: boolean }) =>
			Promise.resolve(
				response(
					input.permission ?? 'NotRequested',
					input.deliveryEnabled ?? false,
				),
			),
	);
});

it('reports denied, not requested, granted and unavailable OS permission honestly', async () => {
	expect(await getCommunityPushPermission()).toBe('NotRequested');
	mockPermissions.mockResolvedValue({ granted: false, canAskAgain: false });
	expect(await getCommunityPushPermission()).toBe('Denied');
	mockPermissions.mockResolvedValue({ granted: true, canAskAgain: false });
	expect(await getCommunityPushPermission()).toBe('Granted');
	mockPermissions.mockRejectedValue(new Error('native unavailable'));
	expect(await getCommunityPushPermission()).toBe('Unavailable');
});

it('returns unavailable on web without loading native permissions', async () => {
	const platform = jest.requireMock('react-native').Platform as {
		OS: string;
	};
	platform.OS = 'web';
	expect(await getCommunityPushPermission()).toBe('Unavailable');
	expect(mockPermissions).not.toHaveBeenCalled();
	platform.OS = 'ios';
});

it('does not prompt during background reconciliation or treat a missing project ID as enabled', async () => {
	mockPermissions.mockResolvedValue({ granted: true });
	expect(getCommunityPushProjectId()).toBeNull();
	const result = await registerCommunityPush('user', false);
	expect(result.deliveryEnabled).toBe(false);
	expect(mockRequest).not.toHaveBeenCalled();
	expect(mockToken).not.toHaveBeenCalled();
});

it('requests permission only from the deliberate action and registers a project-bound token', async () => {
	mockPermissions
		.mockResolvedValueOnce({ granted: false, canAskAgain: true })
		.mockResolvedValue({ granted: true });
	mockConfig.expoConfig.extra.eas.projectId =
		'51092087-87a4-4b12-8008-145625477434';
	const result = await registerCommunityPush('user', true);
	expect(result.deliveryEnabled).toBe(true);
	expect(mockRequest).toHaveBeenCalledTimes(1);
	expect(mockToken).toHaveBeenCalledWith({
		projectId: mockConfig.expoConfig.extra.eas.projectId,
	});
	expect(mockCall).toHaveBeenCalledWith(
		expect.objectContaining({
			token: 'ExpoPushToken[valid]',
			deliveryEnabled: true,
		}),
	);
});

it('keeps delivery disabled after registration or token failure', async () => {
	mockPermissions.mockResolvedValue({ granted: true });
	mockConfig.expoConfig.extra.eas.projectId =
		'51092087-87a4-4b12-8008-145625477434';
	mockToken.mockRejectedValue(new Error('offline'));
	expect((await registerCommunityPush('user', true)).deliveryEnabled).toBe(
		false,
	);
	mockCall.mockRejectedValue(new Error('callable unavailable'));
	expect((await registerCommunityPush('user', false)).registered).toBe(false);
});

it('replaces a refreshed token for an enabled installation without another permission prompt', async () => {
	mockPermissions.mockResolvedValue({ granted: true });
	mockConfig.expoConfig.extra.eas.projectId =
		'51092087-87a4-4b12-8008-145625477434';
	await registerCommunityPush('user', true);
	mockToken.mockResolvedValue({ data: 'ExpoPushToken[refreshed]' });
	await registerCommunityPush('user', false);
	expect(mockCall).toHaveBeenLastCalledWith(
		expect.objectContaining({
			installationId: identity,
			token: 'ExpoPushToken[refreshed]',
			deliveryEnabled: true,
		}),
	);
	expect(mockRequest).not.toHaveBeenCalled();
});

it('stores retry-safe unbinding before logout and clears it after a successful retry', async () => {
	await registerCommunityPush('user', false);
	mockCall.mockRejectedValueOnce(new Error('offline'));
	expect(await unregisterCommunityPush('user')).toBe(false);
	expect(JSON.parse(stored ?? '{}').pendingUnregisterOperationId).toBe(
		'operation',
	);
	mockCall.mockResolvedValue(response('NotRequested', false, false));
	expect(await unregisterCommunityPush('user')).toBe(true);
	expect(stored).toBeNull();
});

it('refuses registration and unbinding when the authenticated account switched', async () => {
	mockAuth.currentUser = { uid: 'other' };
	await expect(registerCommunityPush('user', true)).rejects.toThrow(
		'Account changed',
	);
	await expect(unregisterCommunityPush('user')).rejects.toThrow(
		'Account changed',
	);
});

it('opens only a bounded identifier through the recipient-bound callable and accepts deleted targets', async () => {
	await expect(openCommunityPush('https://example.com')).rejects.toThrow(
		'Invalid notification',
	);
	mockCall.mockResolvedValue({
		data: {
			status: 'Unavailable',
			communityId: null,
			postId: null,
			replyId: null,
		},
	});
	expect(await openCommunityPush('a'.repeat(64))).toEqual({
		status: 'Unavailable',
		communityId: null,
		postId: null,
		replyId: null,
	});
	expect(mockCallable).toHaveBeenCalledWith(
		'functions',
		'openCommunityPushNotification',
	);
});
