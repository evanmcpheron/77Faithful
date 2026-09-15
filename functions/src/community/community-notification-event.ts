import {
	FieldPath,
	getFirestore,
	Timestamp,
	type Firestore,
	type Transaction,
} from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { createHash } from 'node:crypto';
import type {
	ICommunityNotificationEventDocument,
	TCommunityNotificationCategory,
} from '../../generated/types/community/community-notification.types';
import { isBlockedRelationship } from './community-safety';

export const notificationEventId = (
	category: TCommunityNotificationCategory,
	communityId: string,
	postId: string,
	sourceId: string,
): string =>
	createHash('sha256')
		.update(
			`${category}\u0000${communityId}\u0000${postId}\u0000${sourceId}`,
		)
		.digest('hex');

export const createNotificationEvent = (
	transaction: Transaction,
	database: Firestore,
	details: {
		category: TCommunityNotificationCategory;
		communityId: string;
		postId: string;
		replyId: string | null;
		actorUserId: string;
		sourceId: string;
		now: Timestamp;
	},
): void => {
	const event: ICommunityNotificationEventDocument = {
		schemaVersion: 1,
		communityId: details.communityId,
		postId: details.postId,
		replyId: details.replyId,
		actorUserId: details.actorUserId,
		category: details.category,
		createdAt: details.now,
		cursorUserId: null,
		status: 'Pending',
	};
	transaction.create(
		database.doc(
			`communityNotificationEvents/${notificationEventId(details.category, details.communityId, details.postId, details.sourceId)}`,
		),
		event,
	);
};

const sourceAvailable = async (
	transaction: Transaction,
	database: Firestore,
	event: ICommunityNotificationEventDocument,
): Promise<boolean> => {
	const [community, actor, post, reply, support] = await Promise.all([
		transaction.get(database.doc(`communities/${event.communityId}`)),
		transaction.get(database.doc(`users/${event.actorUserId}`)),
		transaction.get(
			database.doc(
				`communities/${event.communityId}/posts/${event.postId}`,
			),
		),
		event.replyId
			? transaction.get(
					database.doc(
						`communities/${event.communityId}/posts/${event.postId}/replies/${event.replyId}`,
					),
				)
			: Promise.resolve(null),
		event.category === 'PrayerSupport'
			? transaction.get(
					database.doc(
						`communities/${event.communityId}/posts/${event.postId}/prayerAcknowledgments/${event.actorUserId}`,
					),
				)
			: Promise.resolve(null),
	]);
	const postData = post.data();
	return (
		community.data()?.lifecycle?.status === 'Active' &&
		actor.exists &&
		postData?.communityId === event.communityId &&
		postData?.publication?.status === 'Published' &&
		(event.category !== 'Announcement' ||
			postData?.publication?.content?.postType ===
				'OrganizerAnnouncement') &&
		(event.category !== 'Announcement' ||
			postData?.author?.userId === event.actorUserId) &&
		(!support ||
			(support.data()?.postId === event.postId &&
				support.data()?.supporter?.userId === event.actorUserId &&
				support.data()?.firstNotificationEligibleAt instanceof
					Timestamp &&
				support
					.data()
					?.firstNotificationEligibleAt.isEqual(
						event.createdAt as Timestamp,
					))) &&
		(!reply ||
			(reply.data()?.publication?.status === 'Published' &&
				reply.data()?.postId === event.postId &&
				reply.data()?.author?.userId === event.actorUserId))
	);
};

export const fanOutCommunityNotificationEvent = async (
	eventId: string,
	database = getFirestore(),
): Promise<boolean> => {
	const reference = database.doc(`communityNotificationEvents/${eventId}`);
	return database.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(reference);
		const event = snapshot.data() as
			ICommunityNotificationEventDocument | undefined;
		if (!event || event.status === 'Complete') return true;
		if (
			event.schemaVersion !== 1 ||
			!(event.createdAt instanceof Timestamp) ||
			!['Reply', 'PrayerSupport', 'Announcement'].includes(
				event.category,
			) ||
			![event.communityId, event.postId, event.actorUserId].every(
				(item) =>
					typeof item === 'string' &&
					/^[A-Za-z0-9_-]{1,128}$/.test(item),
			) ||
			(event.category === 'Reply'
				? typeof event.replyId !== 'string' ||
					!/^[A-Za-z0-9_-]{1,128}$/.test(event.replyId)
				: event.replyId !== null) ||
			(event.cursorUserId !== null &&
				(typeof event.cursorUserId !== 'string' ||
					!/^[A-Za-z0-9_-]{1,128}$/.test(event.cursorUserId))) ||
			notificationEventId(
				event.category,
				event.communityId,
				event.postId,
				event.category === 'Reply'
					? (event.replyId as string)
					: event.category === 'PrayerSupport'
						? event.actorUserId
						: event.postId,
			) !== eventId
		)
			throw new Error('Invalid notification event.');
		if (!(await sourceAvailable(transaction, database, event))) {
			transaction.update(reference, { status: 'Complete' });
			return true;
		}
		let query = database
			.collection(`communities/${event.communityId}/members`)
			.orderBy(FieldPath.documentId())
			.limit(20);
		if (event.cursorUserId) query = query.startAfter(event.cursorUserId);
		const page = await transaction.get(query);
		const post = await transaction.get(
			database.doc(
				`communities/${event.communityId}/posts/${event.postId}`,
			),
		);
		const authorId: unknown = post.data()?.author?.userId;
		const deliveries: {
			reference: ReturnType<Firestore['doc']>;
			joinedAt: Timestamp;
		}[] = [];
		for (const member of page.docs) {
			const data = member.data();
			if (
				data.communityId !== event.communityId ||
				data.userId !== member.id ||
				data.lifecycle?.status !== 'Active' ||
				!(data.joinedAt instanceof Timestamp) ||
				data.joinedAt.seconds > event.createdAt.seconds ||
				(data.joinedAt.seconds === event.createdAt.seconds &&
					data.joinedAt.nanoseconds > event.createdAt.nanoseconds) ||
				member.id === event.actorUserId
			)
				continue;
			if (
				!(await transaction.get(database.doc(`users/${member.id}`)))
					.exists ||
				(await isBlockedRelationship(
					transaction,
					database,
					member.id,
					event.actorUserId,
				))
			)
				continue;
			if (event.category === 'PrayerSupport' && member.id !== authorId)
				continue;
			if (event.category === 'Reply' && member.id !== authorId) {
				const replies = await transaction.get(
					database
						.collection(
							`communities/${event.communityId}/posts/${event.postId}/replies`,
						)
						.where('author.userId', '==', member.id)
						.where('publication.status', '==', 'Published')
						.where('createdAt', '<', event.createdAt as Timestamp)
						.limit(1),
				);
				if (replies.empty) continue;
			}
			const recipient = database.doc(
				`users/${member.id}/communityNotifications/${eventId}`,
			);
			if (!(await transaction.get(recipient)).exists)
				deliveries.push({
					reference: recipient,
					joinedAt: data.joinedAt,
				});
		}
		for (const delivery of deliveries)
			transaction.create(delivery.reference, {
				schemaVersion: 1,
				eventId,
				communityId: event.communityId,
				postId: event.postId,
				replyId: event.replyId,
				actorUserId: event.actorUserId,
				category: event.category,
				createdAt: event.createdAt,
				joinedAt: delivery.joinedAt,
				readAt: null,
			});
		const complete = page.size < 20;
		transaction.update(reference, {
			cursorUserId:
				page.docs[page.docs.length - 1]?.id ?? event.cursorUserId,
			status: complete ? 'Complete' : 'Pending',
		});
		return complete;
	});
};

export const runCommunityNotificationFanOut = async (
	database = getFirestore(),
): Promise<void> => {
	const events = await database
		.collection('communityNotificationEvents')
		.where('status', '==', 'Pending')
		.limit(5)
		.get();
	for (const event of events.docs)
		await fanOutCommunityNotificationEvent(event.id, database);
};

export const deliverCommunityNotificationEvents = onSchedule(
	{ schedule: '*/5 * * * *', timeZone: 'Etc/UTC' },
	async () => runCommunityNotificationFanOut(),
);
