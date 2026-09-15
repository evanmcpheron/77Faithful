import * as SecureStore from 'expo-secure-store';

import { normalizeCommunityInvitationCode } from './community-invitation';

const INVITE_INTENT_STORAGE_KEY = '77faithful.pendingCommunityInvite.v1';
const INVITE_INTENT_LIFETIME_MS = 30 * 24 * 60 * 60 * 1_000;
const MAXIMUM_INVITATION_URL_LENGTH = 2_048;

export interface ICommunityInviteIntent {
	code: string;
	receivedAt: number;
	expiresAt: number;
	boundUserId: string | null;
}

interface IInvitationLinkConfiguration {
	schemes: readonly string[];
	ownedHosts: readonly string[];
}

const isFiniteTimestamp = (value: unknown): value is number =>
	typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

export const parseStoredCommunityInviteIntent = (
	value: string | null,
): ICommunityInviteIntent | null => {
	if (!value) return null;
	try {
		const parsed: unknown = JSON.parse(value);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
			return null;
		const record = parsed as Record<string, unknown>;
		if (
			Object.keys(record).some(
				(key) =>
					![
						'code',
						'receivedAt',
						'expiresAt',
						'boundUserId',
					].includes(key),
			) ||
			typeof record['code'] !== 'string' ||
			!isFiniteTimestamp(record['receivedAt']) ||
			!isFiniteTimestamp(record['expiresAt']) ||
			(record['boundUserId'] !== null &&
				(typeof record['boundUserId'] !== 'string' ||
					!record['boundUserId'])) ||
			record['expiresAt'] <= record['receivedAt'] ||
			record['expiresAt'] - record['receivedAt'] >
				INVITE_INTENT_LIFETIME_MS
		)
			return null;
		return {
			code: normalizeCommunityInvitationCode(record['code']),
			receivedAt: record['receivedAt'],
			expiresAt: record['expiresAt'],
			boundUserId: record['boundUserId'],
		};
	} catch {
		return null;
	}
};

const normalizedSet = (values: readonly string[]): Set<string> =>
	new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean));

export const parseCommunityInvitationUrl = (
	url: string,
	configuration: IInvitationLinkConfiguration,
): string | null => {
	if (!url || url.length > MAXIMUM_INVITATION_URL_LENGTH) return null;
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return null;
	}
	if (parsed.username || parsed.password || parsed.hash) return null;

	const scheme = parsed.protocol.slice(0, -1).toLowerCase();
	const schemes = normalizedSet(configuration.schemes);
	const ownedHosts = normalizedSet(configuration.ownedHosts);
	const host = parsed.hostname.toLowerCase();
	let routePath: string;
	if (schemes.has(scheme)) {
		routePath = host ? `/${host}${parsed.pathname}` : parsed.pathname;
	} else if (scheme === 'https' && ownedHosts.has(host)) {
		routePath = parsed.pathname;
	} else {
		return null;
	}
	if (routePath.replace(/\/+$/, '') !== '/communities/join') return null;
	if ([...parsed.searchParams.keys()].some((key) => key !== 'invitationCode'))
		return null;
	const invitationCodes = parsed.searchParams.getAll('invitationCode');
	if (invitationCodes.length !== 1) return null;
	try {
		return normalizeCommunityInvitationCode(invitationCodes[0] ?? '');
	} catch {
		return null;
	}
};

export const createCommunityInviteIntent = (
	code: string,
	receivedAt: number,
	boundUserId: string | null,
): ICommunityInviteIntent => ({
	code: normalizeCommunityInvitationCode(code),
	receivedAt,
	expiresAt: receivedAt + INVITE_INTENT_LIFETIME_MS,
	boundUserId,
});

export const isCommunityInviteIntentExpired = (
	intent: ICommunityInviteIntent,
	now: number,
): boolean => now >= intent.expiresAt;

export const buildCommunityInvitationLink = (
	code: string,
	scheme: string,
): string => {
	const normalizedCode = normalizeCommunityInvitationCode(code);
	if (!/^[a-z][a-z0-9+.-]*$/i.test(scheme))
		throw new Error('Invalid application link scheme.');
	return `${scheme}:///communities/join?invitationCode=${encodeURIComponent(normalizedCode)}`;
};

export const loadCommunityInviteIntent = async () => {
	if (!(await SecureStore.isAvailableAsync())) return null;
	const storedValue = await SecureStore.getItemAsync(
		INVITE_INTENT_STORAGE_KEY,
	);
	const intent = parseStoredCommunityInviteIntent(storedValue);
	if (storedValue && !intent)
		await SecureStore.deleteItemAsync(INVITE_INTENT_STORAGE_KEY);
	return intent;
};

export const saveCommunityInviteIntent = async (
	intent: ICommunityInviteIntent,
) => {
	if (!(await SecureStore.isAvailableAsync())) return;
	await SecureStore.setItemAsync(
		INVITE_INTENT_STORAGE_KEY,
		JSON.stringify(intent),
		{ keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY },
	);
};

export const deleteCommunityInviteIntent = async () => {
	if (!(await SecureStore.isAvailableAsync())) return;
	await SecureStore.deleteItemAsync(INVITE_INTENT_STORAGE_KEY);
};
