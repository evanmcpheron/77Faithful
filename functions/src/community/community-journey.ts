import {
	FieldPath,
	getFirestore,
	Timestamp,
	type Firestore,
	type Query,
	type Transaction,
} from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
	CommunityJourneyLimits,
	parseCancelCommunityJourneyRequest,
	parseCommunityJourneyPreview,
	parseConfigureCommunityJourneyRequest,
	parseGetCommunityJourneyCourseOptionRequest,
	parseGetCommunityJourneyScheduleRequest,
	parseListCommunityJourneyHistoryRequest,
	parseReviseCommunityJourneyRequest,
} from '../../generated/features/communities/community-journey';
import { getJourneyCalendarDate } from '../../generated/features/journey/journey-calendar';
import type {
	ICancelCommunityJourneyRequest,
	ICancelCommunityJourneyResult,
	IConfigureCommunityJourneyResult,
	IGetCommunityJourneyCourseOptionResult,
	IGetCommunityJourneyScheduleResult,
	IListCommunityJourneyHistoryResult,
	IReviseCommunityJourneyRequest,
	IReviseCommunityJourneyResult,
	TCommunityJourneyReasonCode,
} from '../../generated/types/community/community-function.types';
import type {
	ICommunityJourneyDocument,
	ICommunityJourneyPreview,
} from '../../generated/types/community/community-journey.types';
import type { IFormationCourseReference } from '../../generated/types/formation/formation-course.types';
import { requireCommunityAccount } from './read-community';

interface IDependencies {
	database?: Firestore;
	now?: Timestamp;
}
const error = (
	code: ConstructorParameters<typeof HttpsError>[0],
	message: string,
	reason: TCommunityJourneyReasonCode,
) => new HttpsError(code, message, { reason });
const invalid = () =>
	error(
		'invalid-argument',
		'Check the community journey details.',
		'InvalidInput',
	);
const parse = <T>(parser: (value: unknown) => T, value: unknown): T => {
	try {
		return parser(value);
	} catch {
		throw invalid();
	}
};
const idPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const isId = (value: unknown): value is string =>
	typeof value === 'string' && idPattern.test(value);
const digest = (value: unknown): string =>
	createHash('sha256').update(JSON.stringify(value)).digest('hex');
const receipt = (
	database: Firestore,
	userId: string,
	operation: 'Configure' | 'Revise' | 'Cancel',
	operationId: string,
) =>
	database.doc(
		`users/${userId}/communityJourney${operation}Operations/${operationId}`,
	);

const authorized = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	communityId: string,
) => {
	const [profile, community, member] = await Promise.all([
		transaction.get(database.doc(`users/${userId}`)),
		transaction.get(database.doc(`communities/${communityId}`)),
		transaction.get(
			database.doc(`communities/${communityId}/members/${userId}`),
		),
	]);
	if (!profile.exists)
		throw error(
			'failed-precondition',
			'Your account is unavailable. Please sign in again.',
			'AccountUnavailable',
		);
	if (
		!community.exists ||
		!member.exists ||
		member.get('userId') !== userId ||
		member.get('communityId') !== communityId ||
		member.get('lifecycle.status') !== 'Active'
	)
		throw error(
			'permission-denied',
			'This community is unavailable to your account.',
			'CommunityUnavailable',
		);
	const data = community.data()!;
	if (
		data.lifecycle?.status !== 'Active' &&
		data.lifecycle?.status !== 'Closed'
	)
		throw error(
			'internal',
			'This community could not be loaded.',
			'ScheduleDataUnavailable',
		);
	if (
		data.currentCommunityJourneyId !== undefined &&
		data.currentCommunityJourneyId !== null &&
		!isId(data.currentCommunityJourneyId)
	)
		throw error(
			'internal',
			'This community schedule could not be loaded.',
			'ScheduleDataUnavailable',
		);
	return { reference: community.ref, data, membership: member.data()! };
};
const requireOrganizer = (
	community: Awaited<ReturnType<typeof authorized>>,
	userId: string,
) => {
	if (community.data.lifecycle.status !== 'Active')
		throw error(
			'failed-precondition',
			'This community is closed.',
			'CommunityClosed',
		);
	if (
		community.data.organizerUserId !== userId ||
		community.membership.role !== 'Organizer'
	)
		throw error(
			'permission-denied',
			'Only the organizer can manage this schedule.',
			'OrganizerRequired',
		);
};
const memberPreview = (
	preview: ICommunityJourneyPreview,
	community: Awaited<ReturnType<typeof authorized>>,
	userId: string,
): ICommunityJourneyPreview => ({
	...preview,
	canEnroll:
		community.data.lifecycle.status === 'Active' && preview.canEnroll,
	canRevise:
		community.data.lifecycle.status === 'Active' &&
		community.data.organizerUserId === userId &&
		community.membership.role === 'Organizer' &&
		preview.canRevise,
});
const requireFuture = (
	startDate: string,
	timeZoneId: string,
	now: Timestamp,
) => {
	if (startDate <= getJourneyCalendarDate(now.toDate(), timeZoneId))
		throw error(
			'failed-precondition',
			'Choose a future start date in the community time zone.',
			'EnrollmentClosed',
		);
};
const requirePublishedCourse = async (
	transaction: Transaction,
	database: Firestore,
	course: IFormationCourseReference,
) => {
	const [configuration, parent, version] = await Promise.all([
		transaction.get(database.doc('formationConfiguration/current')),
		transaction.get(database.doc(`formationCourses/${course.courseId}`)),
		transaction.get(
			database.doc(
				`formationCourses/${course.courseId}/versions/${course.courseVersionId}`,
			),
		),
	]);
	const data = version.data();
	if (
		!parent.exists ||
		parent.get('schemaVersion') !== 1 ||
		typeof parent.get('title') !== 'string' ||
		!parent.get('title')?.trim() ||
		configuration.get('courseId') !== course.courseId ||
		configuration.get('courseVersionId') !== course.courseVersionId ||
		data?.courseId !== course.courseId ||
		data?.schemaVersion !== 1 ||
		data?.publicationState?.status !== 'Published' ||
		!(data?.publicationState?.publishedAt instanceof Timestamp) ||
		data?.dayCount !== 77 ||
		data?.weekCount !== 11
	)
		throw error(
			'failed-precondition',
			'This published course is unavailable.',
			'CourseUnavailable',
		);
	const versionReference = version.ref;
	const [days, weeks] = await Promise.all([
		transaction.get(versionReference.collection('days')),
		transaction.get(versionReference.collection('weekIntroductions')),
	]);
	if (
		days.size !== 77 ||
		weeks.size !== 11 ||
		new Set(days.docs.map((day) => day.get('dayNumber'))).size !== 77 ||
		new Set(weeks.docs.map((week) => week.get('weekNumber'))).size !== 11 ||
		days.docs.some(
			(day) =>
				day.get('courseId') !== course.courseId ||
				day.get('courseVersionId') !== course.courseVersionId ||
				!Number.isInteger(day.get('dayNumber')) ||
				day.get('dayNumber') < 1 ||
				day.get('dayNumber') > 77,
		) ||
		weeks.docs.some(
			(week) =>
				week.get('courseId') !== course.courseId ||
				week.get('courseVersionId') !== course.courseVersionId ||
				!Number.isInteger(week.get('weekNumber')) ||
				week.get('weekNumber') < 1 ||
				week.get('weekNumber') > 11,
		)
	)
		throw error(
			'failed-precondition',
			'This published course is unavailable.',
			'CourseUnavailable',
		);
};
const stored = (
	value: FirebaseFirestore.DocumentData | undefined,
	communityId: string,
): ICommunityJourneyDocument => {
	if (
		!value ||
		value.schemaVersion !== 1 ||
		value.communityId !== communityId ||
		!Number.isInteger(value.revision) ||
		value.revision < 0 ||
		value.revision >= 2_147_483_647 ||
		!(value.createdAt instanceof Timestamp) ||
		!(value.updatedAt instanceof Timestamp) ||
		!(
			value.firstEnrollmentAcceptedAt === null ||
			value.firstEnrollmentAcceptedAt instanceof Timestamp
		) ||
		!value.lifecycle ||
		!['Scheduled', 'Active', 'Completed', 'Canceled'].includes(
			value.lifecycle.status,
		) ||
		(value.lifecycle.status === 'Scheduled' &&
			!['Open', 'Closed'].includes(value.lifecycle.enrollmentWindow)) ||
		(value.lifecycle.status === 'Active' &&
			!(value.lifecycle.startedAt instanceof Timestamp)) ||
		(value.lifecycle.status === 'Completed' &&
			!(value.lifecycle.completedAt instanceof Timestamp)) ||
		(value.lifecycle.status === 'Canceled' &&
			!(value.lifecycle.canceledAt instanceof Timestamp))
	)
		throw error(
			'internal',
			'This community schedule could not be loaded.',
			'ScheduleDataUnavailable',
		);
	try {
		parseCommunityJourneyPreview({
			communityJourneyId: 'validated',
			communityId,
			revision: value.revision,
			course: value.course,
			startDate: value.startDate,
			timeZoneId: value.timeZoneId,
			status: value.lifecycle.status,
			canEnroll: false,
			canRevise: false,
		});
	} catch {
		throw error(
			'internal',
			'This community schedule could not be loaded.',
			'ScheduleDataUnavailable',
		);
	}
	return value as ICommunityJourneyDocument;
};
export const safeCommunityJourneyPreview = (
	communityJourneyId: string,
	journey: ICommunityJourneyDocument,
	now: Timestamp,
): ICommunityJourneyPreview =>
	parseCommunityJourneyPreview({
		communityJourneyId,
		communityId: journey.communityId,
		revision: journey.revision,
		course: journey.course,
		startDate: journey.startDate,
		timeZoneId: journey.timeZoneId,
		status: journey.lifecycle.status,
		canEnroll:
			journey.lifecycle.status === 'Scheduled' &&
			journey.startDate >
				getJourneyCalendarDate(now.toDate(), journey.timeZoneId),
		canRevise:
			journey.lifecycle.status === 'Scheduled' &&
			journey.firstEnrollmentAcceptedAt === null &&
			journey.startDate >
				getJourneyCalendarDate(now.toDate(), journey.timeZoneId),
	});
export const readCurrentCommunityJourney = async (
	transaction: Transaction,
	database: Firestore,
	communityId: string,
	community: FirebaseFirestore.DocumentData,
	now: Timestamp,
): Promise<ICommunityJourneyPreview | null> => {
	const id = community.currentCommunityJourneyId;
	if (id == null) return null;
	if (!isId(id))
		throw error(
			'internal',
			'This community schedule could not be loaded.',
			'ScheduleDataUnavailable',
		);
	const snapshot = await transaction.get(
		database.doc(`communities/${communityId}/communityJourneys/${id}`),
	);
	const journey = stored(snapshot.data(), communityId);
	if (
		journey.lifecycle.status !== 'Scheduled' &&
		journey.lifecycle.status !== 'Active'
	)
		throw error(
			'internal',
			'This community schedule could not be loaded.',
			'ScheduleDataUnavailable',
		);
	return safeCommunityJourneyPreview(id, journey, now);
};
const readOperation = (
	snapshot: FirebaseFirestore.DocumentSnapshot,
	input: unknown,
) => {
	if (!snapshot.exists) return null;
	const previous = snapshot.data();
	if (!previous || previous.requestDigest !== digest(input))
		throw error(
			'already-exists',
			'This operation ID was used with different details.',
			'OperationPayloadMismatch',
		);
	if (!isId(previous.communityJourneyId))
		throw error(
			'internal',
			'This schedule operation could not be loaded.',
			'ScheduleDataUnavailable',
		);
	return previous.communityJourneyId as string;
};
const readJourney = async (
	transaction: Transaction,
	database: Firestore,
	communityId: string,
	journeyId: string,
) => {
	const snapshot = await transaction.get(
		database.doc(
			`communities/${communityId}/communityJourneys/${journeyId}`,
		),
	);
	return {
		reference: snapshot.ref,
		data: stored(snapshot.data(), communityId),
	};
};
const writeReceipt = (
	transaction: Transaction,
	reference: FirebaseFirestore.DocumentReference,
	input: unknown,
	journeyId: string,
	now: Timestamp,
) =>
	transaction.create(reference, {
		requestDigest: digest(input),
		communityJourneyId: journeyId,
		createdAt: now,
	});

export const configureCommunityJourneyForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<IConfigureCommunityJourneyResult> => {
	const input = parse(parseConfigureCommunityJourneyRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const journeyReference = database
		.collection(`communities/${input.communityId}/communityJourneys`)
		.doc();
	const operationReference = receipt(
		database,
		userId,
		'Configure',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const community = await authorized(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireOrganizer(community, userId);
		const operationId = readOperation(
			await transaction.get(operationReference),
			input,
		);
		if (operationId) {
			const journey = await readJourney(
				transaction,
				database,
				input.communityId,
				operationId,
			);
			return {
				communityJourney: safeCommunityJourneyPreview(
					operationId,
					journey.data,
					now,
				),
			};
		}
		if (community.data.currentCommunityJourneyId != null)
			throw error(
				'failed-precondition',
				'This community already has a schedule.',
				'ScheduleExists',
			);
		requireFuture(input.startDate, input.timeZoneId, now);
		await requirePublishedCourse(transaction, database, input.course);
		const journey: ICommunityJourneyDocument = {
			schemaVersion: 1,
			communityId: input.communityId,
			course: input.course,
			startDate: input.startDate,
			timeZoneId: input.timeZoneId,
			lifecycle: { status: 'Scheduled', enrollmentWindow: 'Open' },
			revision: 0,
			firstEnrollmentAcceptedAt: null,
			createdAt: now,
			updatedAt: now,
		};
		transaction.create(journeyReference, journey);
		transaction.update(community.reference, {
			currentCommunityJourneyId: journeyReference.id,
			updatedAt: now,
		});
		writeReceipt(
			transaction,
			operationReference,
			input,
			journeyReference.id,
			now,
		);
		return {
			communityJourney: safeCommunityJourneyPreview(
				journeyReference.id,
				journey,
				now,
			),
		};
	});
};
export const reviseCommunityJourneyForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<IReviseCommunityJourneyResult> => {
	const input: IReviseCommunityJourneyRequest = parse(
		parseReviseCommunityJourneyRequest,
		value,
	);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const operationReference = receipt(
		database,
		userId,
		'Revise',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const community = await authorized(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireOrganizer(community, userId);
		const priorId = readOperation(
			await transaction.get(operationReference),
			input,
		);
		const journey = await readJourney(
			transaction,
			database,
			input.communityId,
			input.communityJourneyId,
		);
		if (priorId) {
			if (priorId !== input.communityJourneyId)
				throw error(
					'internal',
					'This schedule operation could not be loaded.',
					'ScheduleDataUnavailable',
				);
			return {
				communityJourney: safeCommunityJourneyPreview(
					priorId,
					journey.data,
					now,
				),
			};
		}
		if (
			community.data.currentCommunityJourneyId !==
				input.communityJourneyId ||
			journey.data.lifecycle.status !== 'Scheduled'
		)
			throw error(
				'failed-precondition',
				'This schedule is unavailable.',
				'ScheduleUnavailable',
			);
		if (journey.data.firstEnrollmentAcceptedAt !== null)
			throw error(
				'failed-precondition',
				'This schedule is frozen after the first enrollment.',
				'ScheduleFrozen',
			);
		if (journey.data.revision !== input.expectedRevision)
			throw error(
				'aborted',
				'This schedule changed. Review it again.',
				'RevisionConflict',
			);
		requireFuture(input.startDate, input.timeZoneId, now);
		await requirePublishedCourse(transaction, database, input.course);
		const updated: ICommunityJourneyDocument = {
			...journey.data,
			course: input.course,
			startDate: input.startDate,
			timeZoneId: input.timeZoneId,
			revision: journey.data.revision + 1,
			updatedAt: now,
		};
		transaction.update(journey.reference, {
			course: updated.course,
			startDate: updated.startDate,
			timeZoneId: updated.timeZoneId,
			revision: updated.revision,
			updatedAt: now,
		});
		writeReceipt(
			transaction,
			operationReference,
			input,
			input.communityJourneyId,
			now,
		);
		return {
			communityJourney: safeCommunityJourneyPreview(
				input.communityJourneyId,
				updated,
				now,
			),
		};
	});
};
export const cancelCommunityJourneyForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<ICancelCommunityJourneyResult> => {
	const input: ICancelCommunityJourneyRequest = parse(
		parseCancelCommunityJourneyRequest,
		value,
	);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const operationReference = receipt(
		database,
		userId,
		'Cancel',
		input.operationId,
	);
	return database.runTransaction(async (transaction) => {
		const community = await authorized(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireOrganizer(community, userId);
		const priorId = readOperation(
			await transaction.get(operationReference),
			input,
		);
		const journey = await readJourney(
			transaction,
			database,
			input.communityId,
			input.communityJourneyId,
		);
		if (priorId) {
			if (
				priorId !== input.communityJourneyId ||
				journey.data.lifecycle.status !== 'Canceled'
			)
				throw error(
					'internal',
					'This schedule operation could not be loaded.',
					'ScheduleDataUnavailable',
				);
			return {
				communityJourney: safeCommunityJourneyPreview(
					priorId,
					journey.data,
					now,
				),
			};
		}
		if (
			community.data.currentCommunityJourneyId !==
				input.communityJourneyId ||
			journey.data.lifecycle.status !== 'Scheduled'
		)
			throw error(
				'failed-precondition',
				'This scheduled journey is unavailable.',
				'ScheduleUnavailable',
			);
		if (journey.data.revision !== input.expectedRevision)
			throw error(
				'aborted',
				'This schedule changed. Review it again.',
				'RevisionConflict',
			);
		const canceled: ICommunityJourneyDocument = {
			...journey.data,
			lifecycle: { status: 'Canceled', canceledAt: now },
			revision: journey.data.revision + 1,
			updatedAt: now,
		};
		transaction.update(journey.reference, {
			lifecycle: canceled.lifecycle,
			revision: canceled.revision,
			updatedAt: now,
		});
		transaction.update(community.reference, {
			currentCommunityJourneyId: null,
			updatedAt: now,
		});
		writeReceipt(
			transaction,
			operationReference,
			input,
			input.communityJourneyId,
			now,
		);
		return {
			communityJourney: safeCommunityJourneyPreview(
				input.communityJourneyId,
				canceled,
				now,
			),
		};
	});
};
export const getCommunityJourneyScheduleForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<IGetCommunityJourneyScheduleResult> => {
	const input = parse(parseGetCommunityJourneyScheduleRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	return database.runTransaction(async (transaction) => {
		const community = await authorized(
			transaction,
			database,
			userId,
			input.communityId,
		);
		const preview = await readCurrentCommunityJourney(
			transaction,
			database,
			input.communityId,
			community.data,
			now,
		);
		return {
			communityJourney: preview
				? memberPreview(preview, community, userId)
				: null,
		};
	});
};
export const getCommunityJourneyCourseOptionForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<IGetCommunityJourneyCourseOptionResult> => {
	const input = parse(parseGetCommunityJourneyCourseOptionRequest, value);
	const database = dependencies.database ?? getFirestore();
	return database.runTransaction(async (transaction) => {
		const community = await authorized(
			transaction,
			database,
			userId,
			input.communityId,
		);
		requireOrganizer(community, userId);
		const configuration = await transaction.get(
			database.doc('formationConfiguration/current'),
		);
		const courseId = configuration.get('courseId');
		const courseVersionId = configuration.get('courseVersionId');
		if (!isId(courseId) || !isId(courseVersionId)) return { course: null };
		const course = { courseId, courseVersionId };
		try {
			await requirePublishedCourse(transaction, database, course);
		} catch (caught) {
			if (
				caught instanceof HttpsError &&
				(caught.details as { reason?: string } | undefined)?.reason ===
					'CourseUnavailable'
			)
				return { course: null };
			throw caught;
		}
		return { course };
	});
};
const encodeCursor = (
	communityId: string,
	timestamp: Timestamp,
	journeyId: string,
): string =>
	Buffer.from(
		JSON.stringify({
			v: 1,
			communityId,
			seconds: timestamp.seconds,
			nanoseconds: timestamp.nanoseconds,
			journeyId,
		}),
	).toString('base64url');
const decodeCursor = (value: string, communityId: string) => {
	try {
		const decoded = JSON.parse(
			Buffer.from(value, 'base64url').toString('utf8'),
		);
		if (
			decoded.v !== 1 ||
			decoded.communityId !== communityId ||
			!Number.isSafeInteger(decoded.seconds) ||
			decoded.seconds < 0 ||
			!Number.isInteger(decoded.nanoseconds) ||
			decoded.nanoseconds < 0 ||
			decoded.nanoseconds > 999_999_999 ||
			!isId(decoded.journeyId) ||
			encodeCursor(
				communityId,
				new Timestamp(decoded.seconds, decoded.nanoseconds),
				decoded.journeyId,
			) !== value
		)
			throw new Error('Invalid cursor.');
		return {
			timestamp: new Timestamp(decoded.seconds, decoded.nanoseconds),
			journeyId: decoded.journeyId as string,
		};
	} catch {
		throw error(
			'invalid-argument',
			'Choose a valid history page.',
			'InvalidCursor',
		);
	}
};
export const listCommunityJourneyHistoryForAccount = async (
	userId: string,
	value: unknown,
	dependencies: IDependencies = {},
): Promise<IListCommunityJourneyHistoryResult> => {
	const input = parse(parseListCommunityJourneyHistoryRequest, value);
	const database = dependencies.database ?? getFirestore();
	const now = dependencies.now ?? Timestamp.now();
	const cursor = input.cursor
		? decodeCursor(input.cursor, input.communityId)
		: null;
	const pageSize = input.pageSize ?? CommunityJourneyLimits.defaultPageSize;
	return database.runTransaction(async (transaction) => {
		const community = await authorized(
			transaction,
			database,
			userId,
			input.communityId,
		);
		let query: Query = database
			.collection(`communities/${input.communityId}/communityJourneys`)
			.orderBy('createdAt', 'desc')
			.orderBy(FieldPath.documentId(), 'desc');
		if (cursor)
			query = query.startAfter(cursor.timestamp, cursor.journeyId);
		const snapshots = (await transaction.get(query.limit(pageSize + 1)))
			.docs;
		const page = snapshots.slice(0, pageSize);
		return {
			communityJourneys: page.map((snapshot) => {
				const preview = safeCommunityJourneyPreview(
					snapshot.id,
					stored(snapshot.data(), input.communityId),
					now,
				);
				return memberPreview(preview, community, userId);
			}),
			nextCursor:
				snapshots.length > pageSize && page.length > 0
					? encodeCursor(
							input.communityId,
							page[page.length - 1].get('createdAt'),
							page[page.length - 1].id,
						)
					: null,
		};
	});
};
export const configureCommunityJourney = onCall(async (request) =>
	configureCommunityJourneyForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const reviseCommunityJourney = onCall(async (request) =>
	reviseCommunityJourneyForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const cancelCommunityJourney = onCall(async (request) =>
	cancelCommunityJourneyForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const getCommunityJourneySchedule = onCall(async (request) =>
	getCommunityJourneyScheduleForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const getCommunityJourneyCourseOption = onCall(async (request) =>
	getCommunityJourneyCourseOptionForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
export const listCommunityJourneyHistory = onCall(async (request) =>
	listCommunityJourneyHistoryForAccount(
		requireCommunityAccount(request.auth),
		request.data,
	),
);
