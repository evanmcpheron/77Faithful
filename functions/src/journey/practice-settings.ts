import {
	getFirestore,
	Timestamp,
	type Firestore,
	type Transaction,
} from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import {
	addJourneyCalendarDays,
	getJourneyCalendarDate,
	getJourneyDayNumber,
} from '../../generated/features/journey/journey-calendar';
import type {
	ICancelPracticeSettingsRequest,
	IConfirmPracticeSettingsRequest,
	IPracticeSettingsRequest,
	TPracticeSettingsResult,
} from '../../generated/features/settings/practice-settings.types';
import type {
	ICancelOptionalPracticeReplacementResult,
	IConfirmOptionalPracticeReplacementResult,
} from '../../generated/types/journey/journey-function.types';
import type {
	IJourneyPracticeSelection,
	IPracticeChangeDocument,
} from '../../generated/types/journey/practice-change.types';
import {
	requirePracticeDate,
	requirePracticeRecord,
	requirePracticeRevision,
	requirePracticeSelection,
} from './practice-settings-request';

const unavailable = () =>
	new HttpsError(
		'failed-precondition',
		'This journey is not available for practice changes.',
	);
const stale = () =>
	new HttpsError(
		'failed-precondition',
		'Your journey or practices have changed. Reload Practices and review the change again.',
	);

const readContext = async (
	transaction: Transaction,
	database: Firestore,
	userId: string,
	journeyId: string,
	zone: string,
	instant: Date,
) => {
	const journeyReference = database.doc(
		`users/${userId}/journeys/${journeyId}`,
	);
	const journey = (await transaction.get(journeyReference)).data();
	if (!journey || journey.userId !== userId)
		throw new HttpsError('not-found', 'This journey is not available.');
	if (journey.state?.status !== 'Active') throw unavailable();
	const startDate = requirePracticeDate(journey.startDate);
	const initialIds = requirePracticeSelection(
		journey.initialOptionalPracticeIds,
	);
	const revision = requirePracticeRevision(journey.practiceScheduleRevision);
	const calendarDate = getJourneyCalendarDate(instant, zone);
	const dayNumber = getJourneyDayNumber(startDate, calendarDate);
	const days = await transaction.get(journeyReference.collection('days'));
	let latestAssignedDay = 0;
	let currentDayIds = null;
	for (const document of days.docs) {
		const day = document.data();
		if (
			!Number.isInteger(day.dayNumber) ||
			day.dayNumber < 1 ||
			day.dayNumber > 77 ||
			day.userId !== userId ||
			day.journeyId !== journeyId
		)
			throw unavailable();
		latestAssignedDay = Math.max(latestAssignedDay, day.dayNumber);
		if (day.dayNumber === dayNumber) {
			if (!Array.isArray(day.practices?.optionalPractices))
				throw unavailable();
			currentDayIds = requirePracticeSelection(
				day.practices.optionalPractices.map(
					(practice: unknown) =>
						requirePracticeRecord(practice).practiceId,
				),
			);
		}
	}
	const snapshot = await transaction.get(
		journeyReference.collection('practiceChanges'),
	);
	const changes = snapshot.docs
		.map((document) => {
			const raw = document.data();
			if (
				raw.userId !== userId ||
				raw.journeyId !== journeyId ||
				!['Pending', 'Applied', 'Canceled', 'Superseded'].includes(
					raw.status,
				) ||
				!Number.isInteger(raw.effectiveDayNumber) ||
				raw.effectiveDayNumber < 2 ||
				raw.effectiveDayNumber > 77
			)
				throw unavailable();
			const effectiveDate = requirePracticeDate(raw.effectiveDate);
			if (
				effectiveDate !==
				addJourneyCalendarDays(startDate, raw.effectiveDayNumber - 1)
			)
				throw unavailable();
			const change = {
				...raw,
				optionalPracticeIds: requirePracticeSelection(
					raw.optionalPracticeIds,
				),
				effectiveDate,
				scheduleRevision: requirePracticeRevision(raw.scheduleRevision),
			} as IPracticeChangeDocument;
			if (change.scheduleRevision > revision) throw unavailable();
			return { reference: document.ref, change };
		})
		.sort(
			(left, right) =>
				left.change.scheduleRevision - right.change.scheduleRevision,
		);
	// Applied changes remain part of reached history even after westward travel,
	// including days whose participation records have not been materialized.
	for (const { change } of changes) {
		if (change.status === 'Applied')
			latestAssignedDay = Math.max(
				latestAssignedDay,
				change.effectiveDayNumber,
			);
	}
	const becameEffective = changes.filter(
		({ change }) =>
			change.status === 'Pending' &&
			(change.effectiveDayNumber <= dayNumber ||
				change.effectiveDayNumber <= latestAssignedDay),
	);
	const upcoming = changes.filter(
		({ change }) =>
			change.status === 'Pending' &&
			change.effectiveDayNumber > dayNumber &&
			change.effectiveDayNumber > latestAssignedDay,
	);
	if (upcoming.length > 1) throw unavailable();
	const pending = upcoming[0];
	let currentOptionalPracticeIds = initialIds;
	for (const { change } of changes) {
		if (
			(change.status === 'Pending' || change.status === 'Applied') &&
			change.effectiveDayNumber <= dayNumber
		)
			currentOptionalPracticeIds = change.optionalPracticeIds;
	}
	const selection: IJourneyPracticeSelection = {
		journeyId,
		currentOptionalPracticeIds: currentDayIds ?? currentOptionalPracticeIds,
		scheduleRevision: revision,
		pendingChange: pending
			? {
					practiceChangeId: pending.reference.id,
					optionalPracticeIds: pending.change.optionalPracticeIds,
					effectiveDayNumber: pending.change.effectiveDayNumber,
					effectiveDate: pending.change.effectiveDate,
				}
			: null,
	};
	return {
		journeyReference,
		dayNumber,
		calendarDate,
		selection,
		pending,
		becameEffective,
		latestAssignedDay,
	};
};

const applyEffectiveStatuses = (
	transaction: Transaction,
	context: Awaited<ReturnType<typeof readContext>>,
	now: Timestamp,
) => {
	for (const { reference } of context.becameEffective)
		transaction.update(reference, { status: 'Applied', updatedAt: now });
};

export const getPracticeSettingsForAccount = async (
	userId: string,
	request: IPracticeSettingsRequest,
	database = getFirestore(),
	now = () => new Date(),
): Promise<TPracticeSettingsResult> =>
	database.runTransaction(async (transaction) => {
		const journeys = await transaction.get(
			database
				.doc(`users/${userId}`)
				.collection('journeys')
				.where('state.status', '==', 'Active')
				.limit(2),
		);
		if (journeys.empty) return { status: 'NoActiveJourney' };
		if (journeys.size > 1) throw unavailable();
		const context = await readContext(
			transaction,
			database,
			userId,
			journeys.docs[0]!.id,
			request.observedPhoneTimeZoneId,
			now(),
		);
		applyEffectiveStatuses(transaction, context, Timestamp.now());
		if (context.dayNumber > 77) return { status: 'Completed' };
		if (context.dayNumber < 1) return { status: 'NotStarted' };
		return {
			status: 'Ready',
			selection: context.selection,
			dayNumber: context.dayNumber,
			calendarDate: context.calendarDate,
			nextDay:
				context.dayNumber < 77 &&
				context.latestAssignedDay <= context.dayNumber
					? {
							dayNumber: context.dayNumber + 1,
							calendarDate: addJourneyCalendarDays(
								context.calendarDate,
								1,
							),
						}
					: null,
		};
	});

type TReplacementCommand =
	| { kind: 'Confirm'; request: IConfirmPracticeSettingsRequest }
	| { kind: 'Cancel'; request: ICancelPracticeSettingsRequest };
type TReplacementResult =
	| IConfirmOptionalPracticeReplacementResult
	| ICancelOptionalPracticeReplacementResult;
interface IReplacementReceipt {
	fingerprint: string;
	result: TReplacementResult;
}

const replacePractices = async (
	userId: string,
	command: TReplacementCommand,
	database: Firestore,
	now: () => Date,
): Promise<TReplacementResult> =>
	database.runTransaction(async (transaction) => {
		const { request } = command;
		const receiptReference = database.doc(
			`users/${userId}/practiceReplacementOperations/${request.operationId}`,
		);
		const fingerprint = JSON.stringify(command);
		const receipt = (await transaction.get(receiptReference)).data() as
			IReplacementReceipt | undefined;
		if (receipt) {
			if (receipt.fingerprint !== fingerprint)
				throw new HttpsError(
					'already-exists',
					'This request was already used for a different change. Reload Practices.',
				);
			return receipt.result;
		}
		const context = await readContext(
			transaction,
			database,
			userId,
			request.journeyId,
			request.observedPhoneTimeZoneId,
			now(),
		);
		if (context.dayNumber < 1 || context.dayNumber > 77)
			throw unavailable();
		if (
			context.selection.scheduleRevision !==
			request.expectedScheduleRevision
		)
			throw stale();
		if (
			getJourneyCalendarDate(now(), request.observedPhoneTimeZoneId) !==
			context.calendarDate
		)
			throw stale();
		const timestamp = Timestamp.now();
		const nextRevision = context.selection.scheduleRevision + 1;
		let result: TReplacementResult;
		if (command.kind === 'Confirm') {
			const confirmation = command.request;
			const effectiveDayNumber = context.dayNumber + 1;
			const effectiveDate = addJourneyCalendarDays(
				context.calendarDate,
				1,
			);
			if (
				effectiveDayNumber > 77 ||
				context.latestAssignedDay >= effectiveDayNumber ||
				confirmation.reviewedEffectiveDayNumber !==
					effectiveDayNumber ||
				confirmation.reviewedEffectiveDate !== effectiveDate
			)
				throw stale();
			const previousIds =
				context.selection.pendingChange?.optionalPracticeIds ??
				context.selection.currentOptionalPracticeIds;
			if (
				previousIds.length ===
					confirmation.optionalPracticeIds.length &&
				previousIds.every((id) =>
					confirmation.optionalPracticeIds.includes(id),
				)
			)
				throw new HttpsError(
					'failed-precondition',
					'Choose a different selection or cancel the pending change.',
				);
			const changeReference = context.journeyReference
				.collection('practiceChanges')
				.doc();
			const change: IPracticeChangeDocument = {
				userId,
				journeyId: request.journeyId,
				optionalPracticeIds: confirmation.optionalPracticeIds,
				effectiveDayNumber,
				effectiveDate,
				confirmedAt: timestamp,
				scheduleRevision: nextRevision,
				status: 'Pending',
				createdAt: timestamp,
				updatedAt: timestamp,
			};
			applyEffectiveStatuses(transaction, context, timestamp);
			if (context.pending)
				transaction.update(context.pending.reference, {
					status: 'Superseded',
					updatedAt: timestamp,
				});
			transaction.create(changeReference, change);
			result = {
				practiceChangeId: changeReference.id,
				confirmedAt: {
					seconds: timestamp.seconds,
					nanoseconds: timestamp.nanoseconds,
				},
				selection: {
					...context.selection,
					scheduleRevision: nextRevision,
					pendingChange: {
						practiceChangeId: changeReference.id,
						optionalPracticeIds: confirmation.optionalPracticeIds,
						effectiveDayNumber,
						effectiveDate,
					},
				},
			};
		} else {
			if (
				!context.pending ||
				context.pending.reference.id !==
					command.request.practiceChangeId
			)
				throw stale();
			applyEffectiveStatuses(transaction, context, timestamp);
			transaction.update(context.pending.reference, {
				status: 'Canceled',
				updatedAt: timestamp,
			});
			result = {
				selection: {
					...context.selection,
					scheduleRevision: nextRevision,
					pendingChange: null,
				},
			};
		}
		transaction.update(context.journeyReference, {
			practiceScheduleRevision: nextRevision,
			updatedAt: timestamp,
		});
		transaction.create(receiptReference, {
			fingerprint,
			result,
		} satisfies IReplacementReceipt);
		return result;
	});

export const confirmPracticeSettingsForAccount = async (
	userId: string,
	request: IConfirmPracticeSettingsRequest,
	database = getFirestore(),
	now = () => new Date(),
): Promise<IConfirmOptionalPracticeReplacementResult> => {
	const result = await replacePractices(
		userId,
		{ kind: 'Confirm', request },
		database,
		now,
	);
	if (!('practiceChangeId' in result)) throw unavailable();
	return result;
};
export const cancelPracticeSettingsForAccount = async (
	userId: string,
	request: ICancelPracticeSettingsRequest,
	database = getFirestore(),
	now = () => new Date(),
): Promise<ICancelOptionalPracticeReplacementResult> =>
	replacePractices(userId, { kind: 'Cancel', request }, database, now);
