import { auth } from '@td/services/firebase/firebase-auth.instance';
import { app } from '@td/services/firebase/firebase.instance';
import type { TNotificationPermissionState } from '@td/types/account/device-preferences.types';
import type { ICommunityNotificationOpenResult } from '@td/types/community/community-notification.types';
import type {
	ICommunityPushInstallationResult,
	IRegisterCommunityPushInstallationRequest,
	IUnregisterCommunityPushInstallationRequest,
} from '@td/types/community/community-push.types';
import Constants from 'expo-constants';
import { getRandomBytes, randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Platform } from 'react-native';
import { parseCommunityNotificationOpenResult } from './community-notification.service';
import {
	parseRegisterCommunityPushInstallationRequest,
	parseUnregisterCommunityPushInstallationRequest,
} from './community-push';

const tokenPattern =
	/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{1,200}\]$/;
const notificationPattern = /^[a-f0-9]{64}$/;
const identityPattern = /^[A-Za-z0-9_-]{1,128}$/;
const storageKey = (userId: string) => `77faithful.communityPush.${userId}.v1`;
const registrationTasks = new Map<string, Promise<unknown>>();
const incomingSubscribers = new Set<() => void>();
export const subscribeCommunityPushIncoming = (
	listener: () => void,
): (() => void) => {
	incomingSubscribers.add(listener);
	return () => {
		incomingSubscribers.delete(listener);
	};
};
export const notifyCommunityPushIncoming = (): void => {
	for (const listener of incomingSubscribers) listener();
};
const requireCurrentAccount = (userId: string): void => {
	if (auth.currentUser?.uid !== userId)
		throw new Error(
			'Account changed while registering push notifications.',
		);
};
const hex = (bytes: Uint8Array): string =>
	Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

export interface ICommunityPushLocalState {
	installationId: string;
	installationSecret: string;
	userId: string;
	deliveryEnabled: boolean;
	registered: boolean;
	pendingUnregisterOperationId: string | null;
}

const parseLocalState = (
	value: string | null,
	userId: string,
): ICommunityPushLocalState | null => {
	if (!value) return null;
	try {
		const data: unknown = JSON.parse(value);
		if (!data || typeof data !== 'object' || Array.isArray(data))
			return null;
		const record = data as Record<string, unknown>;
		if (
			Object.keys(record).length !== 6 ||
			record['userId'] !== userId ||
			typeof record['installationId'] !== 'string' ||
			!/^[A-Za-z0-9]{20}$/.test(record['installationId']) ||
			typeof record['installationSecret'] !== 'string' ||
			!/^[a-f0-9]{64}$/.test(record['installationSecret']) ||
			typeof record['deliveryEnabled'] !== 'boolean' ||
			typeof record['registered'] !== 'boolean' ||
			(record['pendingUnregisterOperationId'] !== null &&
				(typeof record['pendingUnregisterOperationId'] !== 'string' ||
					!identityPattern.test(
						record['pendingUnregisterOperationId'],
					)))
		)
			return null;
		return record as unknown as ICommunityPushLocalState;
	} catch {
		return null;
	}
};

const secureAvailable = async (): Promise<boolean> =>
	Platform.OS !== 'web' && (await SecureStore.isAvailableAsync());

export const readCommunityPushLocalState = async (
	userId: string,
): Promise<ICommunityPushLocalState | null> => {
	if (!identityPattern.test(userId) || !(await secureAvailable()))
		return null;
	return parseLocalState(
		await SecureStore.getItemAsync(storageKey(userId)),
		userId,
	);
};

const save = async (state: ICommunityPushLocalState): Promise<void> => {
	await SecureStore.setItemAsync(
		storageKey(state.userId),
		JSON.stringify(state),
		{
			keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
		},
	);
};

const ensureState = async (
	userId: string,
): Promise<ICommunityPushLocalState> => {
	if (!identityPattern.test(userId) || !(await secureAvailable()))
		throw new Error('Push notifications are unavailable on this device.');
	const previous = await readCommunityPushLocalState(userId);
	if (previous) return previous;
	const state: ICommunityPushLocalState = {
		userId,
		installationId: hex(getRandomBytes(10)),
		installationSecret: hex(getRandomBytes(32)),
		deliveryEnabled: false,
		registered: false,
		pendingUnregisterOperationId: null,
	};
	await save(state);
	return state;
};

const parseInstallationResult = (
	value: unknown,
): ICommunityPushInstallationResult => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid push installation response.');
	const data = value as Record<string, unknown>;
	if (
		Object.keys(data).length !== 4 ||
		typeof data['installationId'] !== 'string' ||
		!/^[A-Za-z0-9]{20}$/.test(data['installationId']) ||
		!['NotRequested', 'Granted', 'Denied', 'Unavailable'].includes(
			data['permission'] as string,
		) ||
		typeof data['deliveryEnabled'] !== 'boolean' ||
		typeof data['registered'] !== 'boolean'
	)
		throw new Error('Invalid push installation response.');
	return data as unknown as ICommunityPushInstallationResult;
};

const notifications = async () => import('expo-notifications');
export const getCommunityPushProjectId = (): string | null => {
	const configured =
		Constants.expoConfig?.extra?.['eas']?.projectId ??
		Constants.easConfig?.projectId;
	return typeof configured === 'string' && /^[a-f0-9-]{36}$/i.test(configured)
		? configured
		: null;
};

export const getCommunityPushPermission =
	async (): Promise<TNotificationPermissionState> => {
		if (Platform.OS === 'web') return 'Unavailable';
		try {
			const api = await notifications();
			const status = await api.getPermissionsAsync();
			if (
				status.granted ||
				status.ios?.status === api.IosAuthorizationStatus.PROVISIONAL
			)
				return 'Granted';
			return status.canAskAgain ? 'NotRequested' : 'Denied';
		} catch {
			return 'Unavailable';
		}
	};

export const requestCommunityPushPermission =
	async (): Promise<TNotificationPermissionState> => {
		const existing = await getCommunityPushPermission();
		if (existing !== 'NotRequested') return existing;
		try {
			const api = await notifications();
			if (Platform.OS === 'android')
				await api.setNotificationChannelAsync('community', {
					name: 'Community notifications',
					importance: api.AndroidImportance.DEFAULT,
				});
			await api.requestPermissionsAsync();
			return getCommunityPushPermission();
		} catch {
			return 'Unavailable';
		}
	};

const registerCommunityPushNow = async (
	userId: string,
	requestPermission: boolean,
): Promise<{
	permission: TNotificationPermissionState;
	registered: boolean;
	deliveryEnabled: boolean;
	issue: string | null;
}> => {
	requireCurrentAccount(userId);
	const permission = requestPermission
		? await requestCommunityPushPermission()
		: await getCommunityPushPermission();
	if (permission === 'Unavailable')
		return {
			permission,
			registered: false,
			deliveryEnabled: false,
			issue: 'Push notifications are unavailable in this build.',
		};
	const state = await ensureState(userId);
	if (requestPermission && permission === 'Granted') {
		state.deliveryEnabled = true;
		await save(state);
	}
	let token: string | null = null;
	let issue: string | null = null;
	if (permission === 'Granted' && state.deliveryEnabled) {
		const projectId = getCommunityPushProjectId();
		if (!projectId) issue = 'Push notifications need an EAS project ID.';
		else
			try {
				const api = await notifications();
				if (Platform.OS === 'android')
					await api.setNotificationChannelAsync('community', {
						name: 'Community notifications',
						importance: api.AndroidImportance.DEFAULT,
					});
				const candidate = (
					await api.getExpoPushTokenAsync({ projectId })
				).data;
				if (!tokenPattern.test(candidate))
					throw new Error('Invalid push token.');
				token = candidate;
			} catch {
				issue = 'Could not obtain a push token. Try again.';
			}
	}
	const input = parseRegisterCommunityPushInstallationRequest({
		installationId: state.installationId,
		installationSecret: state.installationSecret,
		operationId: randomUUID(),
		token,
		permission,
		deliveryEnabled:
			permission === 'Granted' && state.deliveryEnabled && token !== null,
	} satisfies IRegisterCommunityPushInstallationRequest);
	try {
		requireCurrentAccount(userId);
		const callable = httpsCallable<
			IRegisterCommunityPushInstallationRequest,
			unknown
		>(getFunctions(app), 'registerCommunityPushInstallation');
		const result = parseInstallationResult((await callable(input)).data);
		if (
			result.installationId !== state.installationId ||
			result.permission !== permission ||
			result.deliveryEnabled !== input.deliveryEnabled ||
			!result.registered
		)
			throw new Error('Unexpected push installation response.');
		requireCurrentAccount(userId);
		state.registered = true;
		await save(state);
		return {
			permission,
			registered: true,
			deliveryEnabled: result.deliveryEnabled,
			issue,
		};
	} catch {
		return {
			permission,
			registered: false,
			deliveryEnabled: false,
			issue: 'Could not register this device for community notifications. Try again.',
		};
	}
};

export const registerCommunityPush = (
	userId: string,
	requestPermission: boolean,
): Promise<{
	permission: TNotificationPermissionState;
	registered: boolean;
	deliveryEnabled: boolean;
	issue: string | null;
}> => {
	const prior = registrationTasks.get(userId);
	const task = (async () => {
		if (prior) await prior.catch(() => {});
		return registerCommunityPushNow(userId, requestPermission);
	})();
	registrationTasks.set(userId, task);
	void task.then(
		() => {
			if (registrationTasks.get(userId) === task)
				registrationTasks.delete(userId);
		},
		() => {
			if (registrationTasks.get(userId) === task)
				registrationTasks.delete(userId);
		},
	);
	return task;
};

export const unregisterCommunityPush = async (
	userId: string,
): Promise<boolean> => {
	const prior = registrationTasks.get(userId);
	if (prior) await prior.catch(() => {});
	requireCurrentAccount(userId);
	const state = await readCommunityPushLocalState(userId);
	if (!state) return true;
	state.deliveryEnabled = false;
	state.pendingUnregisterOperationId ??= randomUUID();
	await save(state);
	if (!state.registered) {
		await SecureStore.deleteItemAsync(storageKey(userId));
		return true;
	}
	const input = parseUnregisterCommunityPushInstallationRequest({
		installationId: state.installationId,
		installationSecret: state.installationSecret,
		operationId: state.pendingUnregisterOperationId,
	} satisfies IUnregisterCommunityPushInstallationRequest);
	try {
		const callable = httpsCallable<
			IUnregisterCommunityPushInstallationRequest,
			unknown
		>(getFunctions(app), 'unregisterCommunityPushInstallation');
		const result = parseInstallationResult((await callable(input)).data);
		if (result.installationId !== state.installationId || result.registered)
			throw new Error('Unexpected unregistration response.');
		await SecureStore.deleteItemAsync(storageKey(userId));
		return true;
	} catch {
		return false;
	}
};

export const openCommunityPush = async (
	notificationId: string,
): Promise<ICommunityNotificationOpenResult> => {
	if (!notificationPattern.test(notificationId))
		throw new Error('Invalid notification identifier.');
	const callable = httpsCallable<{ notificationId: string }, unknown>(
		getFunctions(app),
		'openCommunityPushNotification',
	);
	return parseCommunityNotificationOpenResult(
		(await callable({ notificationId })).data,
	);
};
