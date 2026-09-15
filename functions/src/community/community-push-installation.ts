import {
	getFirestore,
	Timestamp,
	type Firestore,
} from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
	parseRegisterCommunityPushInstallationRequest,
	parseUnregisterCommunityPushInstallationRequest,
} from '../../generated/features/communities/community-push';
import type {
	ICommunityPushInstallationDocument,
	ICommunityPushInstallationResult,
	TCommunityPushReason,
} from '../../generated/types/community/community-push.types';
import { onCall } from './community-callable';
import { requireCommunityAccount } from './read-community';

const digest = (value: string): string =>
	createHash('sha256').update(value).digest('hex');
const error = (
	code: ConstructorParameters<typeof HttpsError>[0],
	reason: TCommunityPushReason,
): HttpsError =>
	new HttpsError(
		code,
		'This notification installation request could not be completed.',
		{ reason },
	);
const parse = <T>(parser: (value: unknown) => T, value: unknown): T => {
	try {
		return parser(value);
	} catch {
		throw error('invalid-argument', 'InvalidInput');
	}
};
const result = (
	installationId: string,
	data: ICommunityPushInstallationDocument | null,
): ICommunityPushInstallationResult => ({
	installationId,
	permission: data?.permission ?? 'NotRequested',
	deliveryEnabled: data?.deliveryEnabled ?? false,
	registered: data !== null,
});

export const registerCommunityPushInstallationForAccount = async (
	userId: string,
	value: unknown,
	database: Firestore = getFirestore(),
	now = Timestamp.now(),
): Promise<ICommunityPushInstallationResult> => {
	const input = parse(parseRegisterCommunityPushInstallationRequest, value);
	const payloadDigest = digest(
		JSON.stringify({
			installationId: input.installationId,
			installationSecret: input.installationSecret,
			token: input.token,
			permission: input.permission,
			deliveryEnabled: input.deliveryEnabled,
		}),
	);
	const secretDigest = digest(input.installationSecret);
	return database.runTransaction(async (transaction) => {
		const installationRef = database.doc(
			`communityPushInstallations/${input.installationId}`,
		);
		const receiptRef = database.doc(
			`users/${userId}/communityPushRegisterOperations/${input.operationId}`,
		);
		const [account, installation, receipt, owned] = await Promise.all([
			transaction.get(database.doc(`users/${userId}`)),
			transaction.get(installationRef),
			transaction.get(receiptRef),
			transaction.get(
				database
					.collection('communityPushInstallations')
					.where('userId', '==', userId)
					.limit(11),
			),
		]);
		if (!account.exists)
			throw error('failed-precondition', 'AccountUnavailable');
		if (receipt.exists) {
			if (receipt.get('digest') !== payloadDigest)
				throw error('already-exists', 'OperationPayloadMismatch');
			if (
				installation.get('userId') !== userId ||
				installation.get('secretDigest') !== secretDigest
			)
				throw error(
					'permission-denied',
					'InstallationOwnedByAnotherDevice',
				);
			return receipt.get('result') as ICommunityPushInstallationResult;
		}
		const previous = installation.data() as
			ICommunityPushInstallationDocument | undefined;
		if (previous && previous.secretDigest !== secretDigest)
			throw error(
				'permission-denied',
				'InstallationOwnedByAnotherDevice',
			);
		if (previous?.userId !== userId && owned.size >= 10)
			throw error('resource-exhausted', 'InstallationLimitReached');
		const data: ICommunityPushInstallationDocument = {
			schemaVersion: 1,
			userId,
			secretDigest,
			token: input.token,
			tokenDigest: input.token ? digest(input.token) : null,
			permission: input.permission,
			deliveryEnabled: input.deliveryEnabled,
			tokenStatus: input.token ? 'Active' : 'Disabled',
			updatedAt: now,
		};
		transaction.set(installationRef, data);
		const response = result(input.installationId, data);
		transaction.create(receiptRef, {
			digest: payloadDigest,
			result: response,
			createdAt: now,
		});
		return response;
	});
};

export const unregisterCommunityPushInstallationForAccount = async (
	userId: string,
	value: unknown,
	database: Firestore = getFirestore(),
	now = Timestamp.now(),
): Promise<ICommunityPushInstallationResult> => {
	const input = parse(parseUnregisterCommunityPushInstallationRequest, value);
	const payloadDigest = digest(JSON.stringify(input));
	return database.runTransaction(async (transaction) => {
		const installationRef = database.doc(
			`communityPushInstallations/${input.installationId}`,
		);
		const receiptRef = database.doc(
			`users/${userId}/communityPushUnregisterOperations/${input.operationId}`,
		);
		const [account, installation, receipt] = await Promise.all([
			transaction.get(database.doc(`users/${userId}`)),
			transaction.get(installationRef),
			transaction.get(receiptRef),
		]);
		if (!account.exists)
			throw error('failed-precondition', 'AccountUnavailable');
		if (receipt.exists) {
			if (receipt.get('digest') !== payloadDigest)
				throw error('already-exists', 'OperationPayloadMismatch');
			return receipt.get('result') as ICommunityPushInstallationResult;
		}
		const previous = installation.data() as
			ICommunityPushInstallationDocument | undefined;
		if (
			previous &&
			(previous.userId !== userId ||
				previous.secretDigest !== digest(input.installationSecret))
		)
			throw error(
				'permission-denied',
				'InstallationOwnedByAnotherDevice',
			);
		if (previous) transaction.delete(installationRef);
		const response = result(input.installationId, null);
		transaction.create(receiptRef, {
			digest: payloadDigest,
			result: response,
			createdAt: now,
		});
		return response;
	});
};

export const registerCommunityPushInstallation = onCall(async (request) =>
	registerCommunityPushInstallationForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const unregisterCommunityPushInstallation = onCall(async (request) =>
	unregisterCommunityPushInstallationForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
