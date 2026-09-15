import { HttpsError } from 'firebase-functions/v2/https';
import {
	createCipheriv,
	createDecipheriv,
	createHash,
	createSecretKey,
	randomBytes,
	randomInt,
	type KeyObject,
} from 'node:crypto';
import type { IEncryptedCommunityInvitationCode } from '../../generated/types/community/community-invitation.types';

const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_CHARACTER_COUNT = 20;
const NONCE_BYTE_COUNT = 12;
const AUTHENTICATION_TAG_BYTE_COUNT = 16;
const KEY_BYTE_COUNT = 32;
const MAX_KEY_VERSION_COUNT = 10;
const keyVersionPattern = /^[a-zA-Z0-9_-]{1,32}$/;
const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

interface ICommunityInvitationEncryptionConfiguration {
	activeVersion: string;
	keys: ReadonlyMap<string, KeyObject>;
}

const configurationError = (): HttpsError =>
	new HttpsError(
		'failed-precondition',
		'Community invitation encryption is unavailable.',
		{ reason: 'InvitationConfigurationUnavailable' },
	);

const invitationDataError = (): HttpsError =>
	new HttpsError(
		'internal',
		'This community invitation could not be loaded.',
		{ reason: 'InvitationDataUnavailable' },
	);

const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw configurationError();
	return value as Record<string, unknown>;
};

const decodeKey = (value: unknown): KeyObject => {
	if (
		typeof value !== 'string' ||
		value.length < 1 ||
		value.length > 64 ||
		!base64Pattern.test(value)
	)
		throw configurationError();
	const bytes = Buffer.from(value, 'base64');
	if (bytes.length !== KEY_BYTE_COUNT || bytes.toString('base64') !== value)
		throw configurationError();
	return createSecretKey(bytes);
};

export const parseCommunityInvitationEncryptionConfiguration = (
	serialized: string,
): ICommunityInvitationEncryptionConfiguration => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(serialized);
	} catch {
		throw configurationError();
	}
	const configuration = record(parsed);
	if (
		Object.keys(configuration).length !== 2 ||
		!('activeVersion' in configuration) ||
		!('keys' in configuration) ||
		typeof configuration['activeVersion'] !== 'string' ||
		!keyVersionPattern.test(configuration['activeVersion'])
	)
		throw configurationError();
	const serializedKeys = record(configuration['keys']);
	const entries = Object.entries(serializedKeys);
	if (
		entries.length < 1 ||
		entries.length > MAX_KEY_VERSION_COUNT ||
		entries.some(([version]) => !keyVersionPattern.test(version))
	)
		throw configurationError();
	const keys = new Map(
		entries.map(([version, value]) => [version, decodeKey(value)]),
	);
	if (!keys.has(configuration['activeVersion'])) throw configurationError();
	return { activeVersion: configuration['activeVersion'], keys };
};

export const generateCommunityInvitationCode = (): string => {
	const characters = Array.from(
		{ length: CODE_CHARACTER_COUNT },
		() => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
	);
	const normalized = characters.join('');
	return `${normalized.slice(0, 5)}-${normalized.slice(5, 10)}-${normalized.slice(10, 15)}-${normalized.slice(15)}`;
};

export const digestCommunityInvitationCode = (normalizedCode: string): string =>
	createHash('sha256').update(normalizedCode, 'ascii').digest('hex');

const additionalAuthenticatedData = (
	communityId: string,
	invitationId: string,
	keyVersion: string,
): Buffer =>
	Buffer.from(
		`77Faithful:community-invitation:v2:${communityId}:${invitationId}:${keyVersion}`,
		'utf8',
	);

export const encryptCommunityInvitationCode = (
	code: string,
	communityId: string,
	invitationId: string,
	configuration: ICommunityInvitationEncryptionConfiguration,
): IEncryptedCommunityInvitationCode => {
	const keyVersion = configuration.activeVersion;
	const key = configuration.keys.get(keyVersion);
	if (!key) throw configurationError();
	const nonce = randomBytes(NONCE_BYTE_COUNT);
	const cipher = createCipheriv('aes-256-gcm', key, nonce, {
		authTagLength: AUTHENTICATION_TAG_BYTE_COUNT,
	});
	cipher.setAAD(
		additionalAuthenticatedData(communityId, invitationId, keyVersion),
	);
	const ciphertext = Buffer.concat([
		cipher.update(code, 'utf8'),
		cipher.final(),
	]);
	return {
		algorithm: 'Aes256Gcm',
		keyVersion,
		nonce: nonce.toString('base64'),
		ciphertext: ciphertext.toString('base64'),
		authenticationTag: cipher.getAuthTag().toString('base64'),
	};
};

const decodeStoredBytes = (value: unknown, expectedLength?: number): Buffer => {
	if (
		typeof value !== 'string' ||
		value.length < 1 ||
		value.length > 128 ||
		!base64Pattern.test(value)
	)
		throw invitationDataError();
	const bytes = Buffer.from(value, 'base64');
	if (
		(expectedLength !== undefined && bytes.length !== expectedLength) ||
		bytes.toString('base64') !== value
	)
		throw invitationDataError();
	return bytes;
};

export const decryptCommunityInvitationCode = (
	encrypted: IEncryptedCommunityInvitationCode,
	communityId: string,
	invitationId: string,
	configuration: ICommunityInvitationEncryptionConfiguration,
): string => {
	if (
		encrypted.algorithm !== 'Aes256Gcm' ||
		!keyVersionPattern.test(encrypted.keyVersion)
	)
		throw invitationDataError();
	const key = configuration.keys.get(encrypted.keyVersion);
	if (!key) throw configurationError();
	try {
		const decipher = createDecipheriv(
			'aes-256-gcm',
			key,
			decodeStoredBytes(encrypted.nonce, NONCE_BYTE_COUNT),
			{ authTagLength: AUTHENTICATION_TAG_BYTE_COUNT },
		);
		decipher.setAAD(
			additionalAuthenticatedData(
				communityId,
				invitationId,
				encrypted.keyVersion,
			),
		);
		decipher.setAuthTag(
			decodeStoredBytes(
				encrypted.authenticationTag,
				AUTHENTICATION_TAG_BYTE_COUNT,
			),
		);
		return Buffer.concat([
			decipher.update(decodeStoredBytes(encrypted.ciphertext)),
			decipher.final(),
		]).toString('utf8');
	} catch (error) {
		if (error instanceof HttpsError) throw error;
		throw invitationDataError();
	}
};

export type TCommunityInvitationEncryptionConfiguration =
	ICommunityInvitationEncryptionConfiguration;
