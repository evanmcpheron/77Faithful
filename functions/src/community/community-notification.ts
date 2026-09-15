import {
	FieldPath,
	getFirestore,
	Timestamp,
	type Firestore,
	type Transaction,
} from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
	CommunityNotificationLimits,
	parseCommunityNotificationIdRequest,
	parseGetCommunityNotificationPreferencesRequest,
	parseListCommunityNotificationsRequest,
	parseMarkCommunityNotificationReadRequest,
	parseSetCommunityNotificationPreferencesRequest,
} from '../../generated/features/communities/community-notification';
import type {
	ICommunityNotification,
	ICommunityNotificationDocument,
	ICommunityNotificationOpenResult,
	ICommunityNotificationPreferenceResult,
	IListCommunityNotificationsResult,
	TCommunityNotificationReason,
} from '../../generated/types/community/community-notification.types';
import { isBlockedRelationship } from './community-safety';
import { requireCommunityAccount } from './read-community';

const error = (
	code: ConstructorParameters<typeof HttpsError>[0],
	reason: TCommunityNotificationReason,
): HttpsError =>
	new HttpsError(
		code,
		'This community notification request could not be completed.',
		{ reason },
	);
const parse = <T>(parser: (value: unknown) => T, value: unknown): T => {
	try {
		return parser(value);
	} catch {
		throw error('invalid-argument', 'InvalidInput');
	}
};
const defaults = (
	communityId: string,
): ICommunityNotificationPreferenceResult => ({
	communityId,
	categories: { Reply: false, PrayerSupport: false, Announcement: false },
	pushEnabled: false,
});
const preferenceResult = (
	communityId: string,
	value: unknown,
): ICommunityNotificationPreferenceResult => {
	if (!value || typeof value !== 'object')
		throw error('internal', 'NotificationUnavailable');
	const data = value as Record<string, unknown>;
	const categories = data['categories'];
	if (
		data['communityId'] !== communityId ||
		typeof data['pushEnabled'] !== 'boolean' ||
		!categories ||
		typeof categories !== 'object' ||
		!['Reply', 'PrayerSupport', 'Announcement'].every(
			(key) =>
				typeof (categories as Record<string, unknown>)[key] ===
				'boolean',
		)
	)
		throw error('internal', 'NotificationUnavailable');
	const choices = categories as Record<string, boolean>;
	return {
		communityId,
		categories: {
			Reply: choices['Reply'],
			PrayerSupport: choices['PrayerSupport'],
			Announcement: choices['Announcement'],
		},
		pushEnabled: data['pushEnabled'] as boolean,
	};
};
const timestampsEqual = (left: Timestamp, right: Timestamp): boolean =>
	left.seconds === right.seconds && left.nanoseconds === right.nanoseconds;
const document = (
	value: unknown,
	eventId: string,
): ICommunityNotificationDocument | null => {
	if (!value || typeof value !== 'object') return null;
	const data = value as Record<string, unknown>;
	if (
		data['schemaVersion'] !== 1 ||
		data['eventId'] !== eventId ||
		!['Reply', 'PrayerSupport', 'Announcement'].includes(
			data['category'] as string,
		) ||
		![data['communityId'], data['postId'], data['actorUserId']].every(
			(item) =>
				typeof item === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(item),
		) ||
		(data['replyId'] !== null &&
			(typeof data['replyId'] !== 'string' ||
				!/^[A-Za-z0-9_-]{1,128}$/.test(data['replyId']))) ||
		!(data['createdAt'] instanceof Timestamp) ||
		(data['category'] === 'Reply' && data['replyId'] === null) ||
		(data['category'] !== 'Reply' && data['replyId'] !== null) ||
		!(data['joinedAt'] instanceof Timestamp) ||
		(data['readAt'] !== null && !(data['readAt'] instanceof Timestamp))
	)
		return null;
	return data as unknown as ICommunityNotificationDocument;
};
export const communityNotificationAvailable = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	notification: ICommunityNotificationDocument,
): Promise<boolean> => {
	const [community, member, account, actor, deletion, post, reply, support] =
		await Promise.all([
			transaction.get(
				database.doc(`communities/${notification.communityId}`),
			),
			transaction.get(
				database.doc(
					`communities/${notification.communityId}/members/${userId}`,
				),
			),
			transaction.get(database.doc(`users/${userId}`)),
			transaction.get(database.doc(`users/${notification.actorUserId}`)),
			transaction.get(
				database.doc(`communityAccountDeletionCleanup/${userId}`),
			),
			transaction.get(
				database.doc(
					`communities/${notification.communityId}/posts/${notification.postId}`,
				),
			),
			notification.replyId
				? transaction.get(
						database.doc(
							`communities/${notification.communityId}/posts/${notification.postId}/replies/${notification.replyId}`,
						),
					)
				: Promise.resolve(null),
			notification.category === 'PrayerSupport'
				? transaction.get(
						database.doc(
							`communities/${notification.communityId}/posts/${notification.postId}/prayerAcknowledgments/${notification.actorUserId}`,
						),
					)
				: Promise.resolve(null),
		]);
	const membership = member.data();
	const postData = post.data();
	if (
		!account.exists ||
		deletion.exists ||
		!actor.exists ||
		community.data()?.lifecycle?.status !== 'Active' ||
		membership?.lifecycle?.status !== 'Active' ||
		membership?.userId !== userId ||
		!(membership.joinedAt instanceof Timestamp) ||
		!timestampsEqual(
			membership.joinedAt,
			notification.joinedAt as Timestamp,
		) ||
		notification.joinedAt.seconds > notification.createdAt.seconds ||
		(notification.joinedAt.seconds === notification.createdAt.seconds &&
			notification.joinedAt.nanoseconds >
				notification.createdAt.nanoseconds) ||
		postData?.communityId !== notification.communityId ||
		postData?.publication?.status !== 'Published' ||
		(notification.category === 'Announcement' &&
			postData?.author?.userId !== notification.actorUserId) ||
		(notification.category === 'Announcement' &&
			postData?.publication?.content?.postType !==
				'OrganizerAnnouncement') ||
		(support &&
			(support.data()?.postId !== notification.postId ||
				support.data()?.supporter?.userId !==
					notification.actorUserId ||
				!(
					support.data()?.firstNotificationEligibleAt instanceof
					Timestamp
				) ||
				!timestampsEqual(
					support.data()?.firstNotificationEligibleAt,
					notification.createdAt as Timestamp,
				))) ||
		(reply &&
			(reply.data()?.publication?.status !== 'Published' ||
				reply.data()?.postId !== notification.postId ||
				reply.data()?.communityId !== notification.communityId ||
				reply.data()?.author?.userId !== notification.actorUserId))
	)
		return false;
	if (
		await isBlockedRelationship(
			transaction,
			database,
			userId,
			notification.actorUserId,
		)
	)
		return false;
	if (
		postData.author?.userId !== userId &&
		(await isBlockedRelationship(
			transaction,
			database,
			userId,
			postData.author?.userId,
		))
	)
		return false;
	return true;
};
const project = (
	value: ICommunityNotificationDocument,
): ICommunityNotification => ({
	eventId: value.eventId,
	communityId: value.communityId,
	postId: value.postId,
	replyId: value.replyId,
	actorUserId: value.actorUserId,
	category: value.category,
	createdAt: value.createdAt,
	readAt: value.readAt,
});
interface ICursor {
	version: 1;
	userId: string;
	seconds: number;
	nanoseconds: number;
	eventId: string;
}
const cursor = (userId: string, value: string): ICursor => {
	try {
		const decoded: unknown = JSON.parse(
			Buffer.from(value, 'base64url').toString('utf8'),
		);
		if (!decoded || typeof decoded !== 'object') throw new Error();
		const item = decoded as Record<string, unknown>;
		if (
			Object.keys(item).length !== 5 ||
			item['version'] !== 1 ||
			item['userId'] !== userId ||
			!Number.isSafeInteger(item['seconds']) ||
			!Number.isInteger(item['nanoseconds']) ||
			(item['nanoseconds'] as number) < 0 ||
			(item['nanoseconds'] as number) > 999_999_999 ||
			typeof item['eventId'] !== 'string' ||
			!/^[A-Za-z0-9_-]{1,128}$/.test(item['eventId'])
		)
			throw new Error();
		return item as unknown as ICursor;
	} catch {
		throw error('invalid-argument', 'InvalidCursor');
	}
};
const encode = (userId: string, item: ICommunityNotificationDocument): string =>
	Buffer.from(
		JSON.stringify({
			version: 1,
			userId,
			seconds: item.createdAt.seconds,
			nanoseconds: item.createdAt.nanoseconds,
			eventId: item.eventId,
		}),
	).toString('base64url');

export const listCommunityNotificationsForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<IListCommunityNotificationsResult> => {
	const input = parse(parseListCommunityNotificationsRequest, value);
	const start = input.cursor ? cursor(userId, input.cursor) : null;
	return database.runTransaction(async (transaction) => {
		if (!(await transaction.get(database.doc(`users/${userId}`))).exists)
			throw error('failed-precondition', 'AccountUnavailable');
		let query = database
			.collection(`users/${userId}/communityNotifications`)
			.orderBy('createdAt', 'desc')
			.orderBy(FieldPath.documentId(), 'desc')
			.limit(
				input.pageSize ?? CommunityNotificationLimits.defaultPageSize,
			);
		if (start)
			query = query.startAfter(
				new Timestamp(start.seconds, start.nanoseconds),
				start.eventId,
			);
		const page = await transaction.get(query);
		const notifications: ICommunityNotification[] = [];
		for (const snapshot of page.docs) {
			const item = document(snapshot.data(), snapshot.id);
			if (
				item &&
				(await communityNotificationAvailable(
					transaction,
					database,
					userId,
					item,
				))
			)
				notifications.push(project(item));
		}
		const count = await transaction.get(
			database
				.collection(`users/${userId}/communityNotifications`)
				.orderBy('createdAt', 'desc')
				.limit(1001),
		);
		if (count.size > 1000)
			throw error('resource-exhausted', 'NotificationUnavailable');
		let unreadCount = 0;
		for (const snapshot of count.docs) {
			const item = document(snapshot.data(), snapshot.id);
			if (
				item?.readAt === null &&
				(await communityNotificationAvailable(
					transaction,
					database,
					userId,
					item,
				))
			)
				unreadCount++;
		}
		const last = page.docs[page.docs.length - 1];
		const lastItem = last && document(last.data(), last.id);
		return {
			notifications,
			nextCursor:
				page.size ===
					(input.pageSize ??
						CommunityNotificationLimits.defaultPageSize) && lastItem
					? encode(userId, lastItem)
					: null,
			unreadCount,
		};
	});
};

export const openCommunityNotificationForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<ICommunityNotificationOpenResult> => {
	const input = parse(parseCommunityNotificationIdRequest, value);
	return database.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(
			database.doc(
				`users/${userId}/communityNotifications/${input.eventId}`,
			),
		);
		const item = document(snapshot.data(), input.eventId);
		if (
			!item ||
			!(await communityNotificationAvailable(
				transaction,
				database,
				userId,
				item,
			))
		)
			return {
				status: 'Unavailable',
				communityId: null,
				postId: null,
				replyId: null,
			};
		return {
			status: 'Available',
			communityId: item.communityId,
			postId: item.postId,
			replyId: item.replyId,
		};
	});
};

export const markCommunityNotificationReadForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
	now = Timestamp.now(),
): Promise<{ eventId: string; isRead: boolean }> => {
	const input = parse(parseMarkCommunityNotificationReadRequest, value);
	const receiptRef = database.doc(
		`users/${userId}/communityNotificationReadOperations/${input.operationId}`,
	);
	return database.runTransaction(async (transaction) => {
		const [snapshot, receipt] = await Promise.all([
			transaction.get(
				database.doc(
					`users/${userId}/communityNotifications/${input.eventId}`,
				),
			),
			transaction.get(receiptRef),
		]);
		const item = document(snapshot.data(), input.eventId);
		if (
			!item ||
			!(await communityNotificationAvailable(
				transaction,
				database,
				userId,
				item,
			))
		)
			throw error('not-found', 'NotificationUnavailable');
		if (receipt.exists && receipt.data()?.eventId !== input.eventId)
			throw error('already-exists', 'OperationPayloadMismatch');
		if (!receipt.exists)
			transaction.create(receiptRef, {
				eventId: input.eventId,
				createdAt: now,
			});
		if (item.readAt === null)
			transaction.update(snapshot.ref, { readAt: now });
		return { eventId: input.eventId, isRead: true };
	});
};

export const getCommunityNotificationPreferencesForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
): Promise<ICommunityNotificationPreferenceResult> => {
	const input = parse(parseGetCommunityNotificationPreferencesRequest, value);
	return database.runTransaction(async (transaction) => {
		const [account, community, member] = await Promise.all([
			transaction.get(database.doc(`users/${userId}`)),
			transaction.get(database.doc(`communities/${input.communityId}`)),
			transaction.get(
				database.doc(
					`communities/${input.communityId}/members/${userId}`,
				),
			),
		]);
		if (!account.exists)
			throw error('failed-precondition', 'AccountUnavailable');
		if (
			community.data()?.lifecycle?.status !== 'Active' ||
			member.data()?.communityId !== input.communityId ||
			member.data()?.userId !== userId ||
			member.data()?.lifecycle?.status !== 'Active'
		)
			throw error('permission-denied', 'CommunityUnavailable');
		const preference = await transaction.get(
			database.doc(
				`users/${userId}/communityNotificationPreferences/${input.communityId}`,
			),
		);
		return preference.exists
			? preferenceResult(input.communityId, preference.data())
			: defaults(input.communityId);
	});
};

export const setCommunityNotificationPreferencesForAccount = async (
	userId: string,
	value: unknown,
	database = getFirestore(),
	now = Timestamp.now(),
): Promise<ICommunityNotificationPreferenceResult> => {
	const input = parse(parseSetCommunityNotificationPreferencesRequest, value);
	const digest = createHash('sha256')
		.update(
			JSON.stringify({
				communityId: input.communityId,
				category: input.category,
				categoryEnabled: input.categoryEnabled,
				pushEnabled: input.pushEnabled,
			}),
		)
		.digest('hex');
	return database.runTransaction(async (transaction) => {
		const [account, community, member, receipt, preference] =
			await Promise.all([
				transaction.get(database.doc(`users/${userId}`)),
				transaction.get(
					database.doc(`communities/${input.communityId}`),
				),
				transaction.get(
					database.doc(
						`communities/${input.communityId}/members/${userId}`,
					),
				),
				transaction.get(
					database.doc(
						`users/${userId}/communityNotificationPreferenceOperations/${input.operationId}`,
					),
				),
				transaction.get(
					database.doc(
						`users/${userId}/communityNotificationPreferences/${input.communityId}`,
					),
				),
			]);
		if (!account.exists)
			throw error('failed-precondition', 'AccountUnavailable');
		if (
			community.data()?.lifecycle?.status !== 'Active' ||
			member.data()?.communityId !== input.communityId ||
			member.data()?.userId !== userId ||
			member.data()?.lifecycle?.status !== 'Active'
		)
			throw error('permission-denied', 'CommunityUnavailable');
		if (receipt.exists && receipt.data()?.digest !== digest)
			throw error('already-exists', 'OperationPayloadMismatch');
		const previous = preference.exists
			? preferenceResult(input.communityId, preference.data())
			: defaults(input.communityId);
		if (receipt.exists) return previous;
		const result = {
			communityId: input.communityId,
			categories: {
				...previous.categories,
				[input.category]: input.categoryEnabled,
			},
			pushEnabled: input.pushEnabled,
		};
		transaction.set(preference.ref, result);
		transaction.create(
			database.doc(
				`users/${userId}/communityNotificationPreferenceOperations/${input.operationId}`,
			),
			{ digest, createdAt: now },
		);
		return result;
	});
};

export const listCommunityNotifications = onCall(async (request) =>
	listCommunityNotificationsForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const openCommunityNotification = onCall(async (request) =>
	openCommunityNotificationForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const markCommunityNotificationRead = onCall(async (request) =>
	markCommunityNotificationReadForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const getCommunityNotificationPreferences = onCall(async (request) =>
	getCommunityNotificationPreferencesForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const setCommunityNotificationPreferences = onCall(async (request) =>
	setCommunityNotificationPreferencesForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
