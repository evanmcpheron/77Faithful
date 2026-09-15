import {
	getFirestore,
	Timestamp,
	type Firestore,
} from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import type {
	ICommunityNotificationDocument,
	ICommunityNotificationOpenResult,
} from '../../generated/types/community/community-notification.types';
import type {
	ICommunityPushDeliveryDocument,
	ICommunityPushInstallationDocument,
} from '../../generated/types/community/community-push.types';
import { onCall } from './community-callable';
import {
	communityNotificationAvailable,
	openCommunityNotificationForAccount,
} from './community-notification';
import { requireCommunityAccount } from './read-community';

const expoAccessToken = defineSecret('EXPO_PUSH_ACCESS_TOKEN');
const sendEndpoint = 'https://exp.host/--/api/v2/push/send';
const receiptEndpoint = 'https://exp.host/--/api/v2/push/getReceipts';
const maxAttempts = 5;
const minute = 60 * 1000;
const later = (now: Timestamp, milliseconds: number): Timestamp =>
	Timestamp.fromMillis(now.toMillis() + milliseconds);
const backoff = (attempts: number): number =>
	Math.min(60 * minute, 2 ** attempts * minute);
const object = (value: unknown): Record<string, unknown> | null =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
const errorCode = (value: unknown): string | null => {
	const details = object(object(value)?.['details']);
	return typeof details?.['error'] === 'string' ? details['error'] : null;
};
const validTask = (task: unknown): task is ICommunityPushDeliveryDocument => {
	const data = object(task);
	return (
		!!data &&
		data['schemaVersion'] === 1 &&
		['userId', 'installationId'].every(
			(key) =>
				typeof data[key] === 'string' &&
				/^[A-Za-z0-9_-]{1,128}$/.test(data[key]),
		) &&
		typeof data['eventId'] === 'string' &&
		/^[a-f0-9]{64}$/.test(data['eventId']) &&
		Number.isInteger(data['attempts']) &&
		(data['attempts'] as number) >= 0 &&
		(data['attempts'] as number) <= maxAttempts &&
		Number.isInteger(data['receiptChecks']) &&
		(data['receiptChecks'] as number) >= 0 &&
		(data['receiptChecks'] as number) <= 8 &&
		data['nextAttemptAt'] instanceof Timestamp &&
		data['createdAt'] instanceof Timestamp
	);
};
export const genericCommunityPushPayload = (
	token: string,
	notificationId: string,
): Record<string, unknown> => ({
	to: token,
	title: '77Faithful',
	body: 'You have a new community notification.',
	sound: 'default',
	data: { notificationId },
});

export type TExpoPushTransport = (
	url: string,
	body: unknown,
	accessToken: string,
) => Promise<{ status: number; body: unknown }>;
export const expoPushTransport: TExpoPushTransport = async (
	url,
	body,
	accessToken,
) => {
	if (url !== sendEndpoint && url !== receiptEndpoint)
		throw new Error('Unsupported push endpoint.');
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(15000),
	});
	return { status: response.status, body: await response.json() };
};

const disableToken = async (
	database: Firestore,
	installationId: string,
	userId: string,
	tokenDigest: string | null,
): Promise<void> => {
	if (!tokenDigest) return;
	await database.runTransaction(async (transaction) => {
		const reference = database.doc(
			`communityPushInstallations/${installationId}`,
		);
		const state = await transaction.get(reference);
		if (
			state.get('userId') === userId &&
			state.get('tokenDigest') === tokenDigest
		)
			transaction.update(reference, {
				token: null,
				tokenDigest: null,
				tokenStatus: 'Disabled',
				deliveryEnabled: false,
				updatedAt: Timestamp.now(),
			});
	});
};

const claimSend = async (
	database: Firestore,
	taskId: string,
	now: Timestamp,
): Promise<{
	token: string;
	tokenDigest: string;
	installationId: string;
	userId: string;
	attempts: number;
} | null> =>
	database.runTransaction(async (transaction) => {
		const taskRef = database.doc(`communityPushDeliveries/${taskId}`);
		const snapshot = await transaction.get(taskRef);
		const task = snapshot.data();
		if (!validTask(task)) {
			if (snapshot.exists)
				transaction.update(taskRef, { status: 'Complete' });
			return null;
		}
		if (
			!['Pending', 'Sending'].includes(task.status) ||
			(task.nextAttemptAt as Timestamp).toMillis() > now.toMillis()
		)
			return null;
		const [installation, notification] = await Promise.all([
			transaction.get(
				database.doc(
					`communityPushInstallations/${task.installationId}`,
				),
			),
			transaction.get(
				database.doc(
					`users/${task.userId}/communityNotifications/${task.eventId}`,
				),
			),
		]);
		const state = installation.data() as
			ICommunityPushInstallationDocument | undefined;
		const entry = notification.data() as
			ICommunityNotificationDocument | undefined;
		if (
			!entry ||
			entry.eventId !== task.eventId ||
			!state ||
			state.userId !== task.userId ||
			state.permission !== 'Granted' ||
			!state.deliveryEnabled ||
			state.tokenStatus !== 'Active' ||
			!state.token ||
			!state.tokenDigest ||
			!/^((ExponentPushToken)|(ExpoPushToken))\[[A-Za-z0-9_-]{1,200}\]$/.test(
				state.token,
			) ||
			!(await communityNotificationAvailable(
				transaction,
				database,
				task.userId,
				entry,
			))
		) {
			transaction.update(taskRef, { status: 'Complete' });
			return null;
		}
		const preference = await transaction.get(
			database.doc(
				`users/${task.userId}/communityNotificationPreferences/${entry.communityId}`,
			),
		);
		const choices = preference.data();
		if (
			choices?.pushEnabled !== true ||
			choices?.categories?.[entry.category] !== true ||
			choices?.communityId !== entry.communityId
		) {
			transaction.update(taskRef, { status: 'Complete' });
			return null;
		}
		if (task.attempts >= maxAttempts) {
			transaction.update(taskRef, { status: 'Complete' });
			return null;
		}
		const attempts = task.attempts + 1;
		transaction.update(taskRef, {
			status: 'Sending',
			attempts,
			nextAttemptAt: later(now, 2 * minute),
			tokenDigest: state.tokenDigest,
		});
		return {
			token: state.token,
			tokenDigest: state.tokenDigest,
			installationId: task.installationId,
			userId: task.userId,
			attempts,
		};
	});

const finishSend = async (
	database: Firestore,
	taskId: string,
	attempts: number,
	status: 'Pending' | 'AwaitReceipt' | 'Complete',
	now: Timestamp,
	ticketId: string | null,
): Promise<void> => {
	await database.runTransaction(async (transaction) => {
		const reference = database.doc(`communityPushDeliveries/${taskId}`);
		const snapshot = await transaction.get(reference);
		if (
			snapshot.get('status') !== 'Sending' ||
			snapshot.get('attempts') !== attempts
		)
			return;
		transaction.update(reference, {
			status,
			ticketId,
			receiptChecks:
				status === 'AwaitReceipt' ? 0 : snapshot.get('receiptChecks'),
			nextAttemptAt: later(
				now,
				status === 'AwaitReceipt' ? 15 * minute : backoff(attempts),
			),
		});
	});
};

export const processCommunityPushSend = async (
	taskId: string,
	database: Firestore = getFirestore(),
	transport: TExpoPushTransport = expoPushTransport,
	accessToken = expoAccessToken.value(),
	now = Timestamp.now(),
): Promise<void> => {
	if (!accessToken) return;
	const claim = await claimSend(database, taskId, now);
	if (!claim) return;
	let status: 'Pending' | 'AwaitReceipt' | 'Complete' = 'Pending';
	let ticketId: string | null = null;
	try {
		const response = await transport(
			sendEndpoint,
			genericCommunityPushPayload(claim.token, taskId),
			accessToken,
		);
		if (
			response.status === 401 ||
			response.status === 403 ||
			(response.status >= 400 &&
				response.status < 500 &&
				response.status !== 429)
		)
			status = 'Complete';
		else if (response.status === 200) {
			const body = object(response.body);
			const requestCode = Array.isArray(body?.['errors'])
				? object(body['errors'][0])?.['code']
				: null;
			if (requestCode === 'UNAUTHORIZED') status = 'Complete';
			const ticket = Array.isArray(body?.['data'])
				? object(body['data'][0])
				: null;
			if (
				status !== 'Complete' &&
				ticket?.['status'] === 'ok' &&
				typeof ticket['id'] === 'string' &&
				/^[A-Za-z0-9-]{1,128}$/.test(ticket['id'])
			) {
				status = 'AwaitReceipt';
				ticketId = ticket['id'];
			} else if (
				status !== 'Complete' &&
				errorCode(ticket) === 'DeviceNotRegistered'
			) {
				status = 'Complete';
				await disableToken(
					database,
					claim.installationId,
					claim.userId,
					claim.tokenDigest,
				);
			} else if (
				status !== 'Complete' &&
				ticket?.['status'] === 'error' &&
				errorCode(ticket) !== 'MessageRateExceeded'
			)
				status = 'Complete';
		}
	} catch {
		/* Ambiguous submission: lease and bounded retry may duplicate a device alert. */
	}
	await finishSend(
		database,
		taskId,
		claim.attempts,
		claim.attempts >= maxAttempts && status === 'Pending'
			? 'Complete'
			: status,
		now,
		ticketId,
	);
};

export const processCommunityPushReceipt = async (
	taskId: string,
	database: Firestore = getFirestore(),
	transport: TExpoPushTransport = expoPushTransport,
	accessToken = expoAccessToken.value(),
	now = Timestamp.now(),
): Promise<void> => {
	if (!accessToken) return;
	const reference = database.doc(`communityPushDeliveries/${taskId}`);
	const snapshot = await reference.get();
	const task = snapshot.data();
	if (
		!validTask(task) ||
		task.status !== 'AwaitReceipt' ||
		!task.ticketId ||
		(task.nextAttemptAt as Timestamp).toMillis() > now.toMillis()
	)
		return;
	let receipt: Record<string, unknown> | null = null;
	try {
		const response = await transport(
			receiptEndpoint,
			{ ids: [task.ticketId] },
			accessToken,
		);
		if (response.status === 200)
			receipt =
				(object(object(response.body)?.['data'])?.[
					task.ticketId
				] as Record<string, unknown> | null) ?? null;
		else if (response.status === 401 || response.status === 403)
			receipt = {
				status: 'error',
				details: { error: 'InvalidCredentials' },
			};
	} catch {
		/* Retry the same receipt ID later. */
	}
	const code = errorCode(receipt);
	if (code === 'DeviceNotRegistered')
		await disableToken(
			database,
			task.installationId,
			task.userId,
			task.tokenDigest,
		);
	await database.runTransaction(async (transaction) => {
		const current = await transaction.get(reference);
		if (
			current.get('status') !== 'AwaitReceipt' ||
			current.get('ticketId') !== task.ticketId
		)
			return;
		const missing = !receipt;
		const checks = task.receiptChecks + 1;
		const receiptExpired =
			checks >= 8 ||
			now.toMillis() - (task.createdAt as Timestamp).toMillis() >=
				24 * 60 * minute;
		const resend =
			code === 'MessageRateExceeded' || (missing && receiptExpired);
		const retrySend = resend && task.attempts < maxAttempts;
		transaction.update(reference, {
			status:
				missing && !receiptExpired
					? 'AwaitReceipt'
					: retrySend
						? 'Pending'
						: 'Complete',
			ticketId: retrySend ? null : task.ticketId,
			receiptChecks: checks,
			nextAttemptAt: later(now, backoff(checks)),
		});
	});
};

export const runCommunityPushSender = async (
	database: Firestore = getFirestore(),
	transport: TExpoPushTransport = expoPushTransport,
	accessToken = expoAccessToken.value(),
	now = Timestamp.now(),
): Promise<void> => {
	if (!accessToken) return;
	for (const status of ['Pending', 'Sending'] as const) {
		const page = await database
			.collection('communityPushDeliveries')
			.where('status', '==', status)
			.where('nextAttemptAt', '<=', now)
			.limit(10)
			.get();
		for (const task of page.docs)
			await processCommunityPushSend(
				task.id,
				database,
				transport,
				accessToken,
				now,
			);
	}
};
export const runCommunityPushReceipts = async (
	database: Firestore = getFirestore(),
	transport: TExpoPushTransport = expoPushTransport,
	accessToken = expoAccessToken.value(),
	now = Timestamp.now(),
): Promise<void> => {
	if (!accessToken) return;
	const page = await database
		.collection('communityPushDeliveries')
		.where('status', '==', 'AwaitReceipt')
		.where('nextAttemptAt', '<=', now)
		.limit(20)
		.get();
	for (const task of page.docs)
		await processCommunityPushReceipt(
			task.id,
			database,
			transport,
			accessToken,
			now,
		);
};
export const sendCommunityPushOutbox = onSchedule(
	{
		schedule: 'every 1 minutes',
		maxInstances: 1,
		timeoutSeconds: 540,
		secrets: [expoAccessToken],
	},
	async () => runCommunityPushSender(),
);
export const checkCommunityPushReceipts = onSchedule(
	{
		schedule: 'every 5 minutes',
		maxInstances: 1,
		timeoutSeconds: 540,
		secrets: [expoAccessToken],
	},
	async () => runCommunityPushReceipts(),
);

export const openCommunityPushNotification = onCall(
	async (request): Promise<ICommunityNotificationOpenResult> => {
		const userId = requireCommunityAccount(request.auth);
		const data = object(request.data);
		if (
			!data ||
			Object.keys(data).length !== 1 ||
			typeof data['notificationId'] !== 'string' ||
			!/^[a-f0-9]{64}$/.test(data['notificationId'])
		)
			throw new HttpsError(
				'invalid-argument',
				'Invalid notification identifier.',
				{ reason: 'InvalidInput' },
			);
		const task = await getFirestore()
			.doc(`communityPushDeliveries/${data['notificationId']}`)
			.get();
		if (task.get('userId') !== userId)
			return {
				status: 'Unavailable',
				communityId: null,
				postId: null,
				replyId: null,
			};
		return openCommunityNotificationForAccount(userId, {
			eventId: task.get('eventId'),
		});
	},
);
