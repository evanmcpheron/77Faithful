import { app } from '@td/services/firebase/firebase.instance';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	REFLECTION_PAGE_SIZE,
	type IListReflectionsRequest,
	type IReflectionCursor,
	type IReflectionPage,
	type TReflectionEntry,
} from './reflections.types';

export const isReflectionEntry = (
	value: unknown,
	userId: string,
): value is TReflectionEntry => {
	if (!value || typeof value !== 'object') return false;
	const entry = value as Partial<TReflectionEntry>;
	return (
		entry.userId === userId &&
		typeof entry.journeyId === 'string' &&
		/^[a-zA-Z0-9_-]{1,128}$/.test(entry.journeyId) &&
		Number.isInteger(entry.dayNumber) &&
		Number(entry.dayNumber) >= 1 &&
		Number(entry.dayNumber) <= 77 &&
		typeof entry.calendarDate === 'string' &&
		/^\d{4}-\d{2}-\d{2}$/.test(entry.calendarDate) &&
		Number.isFinite(Date.parse(`${entry.calendarDate}T12:00:00Z`)) &&
		new Date(`${entry.calendarDate}T12:00:00Z`)
			.toISOString()
			.slice(0, 10) === entry.calendarDate &&
		typeof entry.reflection?.text === 'string' &&
		Boolean(entry.reflection.text.trim()) &&
		typeof entry.reflection.revisionId === 'string' &&
		Boolean(entry.reflection.revisionId) &&
		Number.isSafeInteger(entry.reflection.updatedAt?.seconds) &&
		Number.isInteger(entry.reflection.updatedAt?.nanoseconds) &&
		entry.reflection.updatedAt.nanoseconds >= 0 &&
		entry.reflection.updatedAt.nanoseconds < 1e9
	);
};

export const loadReflections = async (
	userId: string,
	cursor: IReflectionCursor | null = null,
): Promise<IReflectionPage> => {
	const callable = httpsCallable<IListReflectionsRequest, unknown>(
		getFunctions(app),
		'listReflections',
	);
	const { data } = await callable({
		observedPhoneTimeZoneId:
			Intl.DateTimeFormat().resolvedOptions().timeZone,
		paginated: true,
		cursor,
	});
	if (
		!data ||
		typeof data !== 'object' ||
		!('entries' in data) ||
		!('nextCursor' in data) ||
		!Array.isArray(data.entries) ||
		data.entries.length > REFLECTION_PAGE_SIZE ||
		!data.entries.every((entry) => isReflectionEntry(entry, userId))
	)
		throw new Error('Invalid reflection history.');
	const next = data.nextCursor;
	if (next === null) return { entries: data.entries, nextCursor: null };
	if (
		typeof next !== 'object' ||
		!('journeyId' in next) ||
		!('beforeDayNumber' in next) ||
		typeof next.journeyId !== 'string' ||
		!/^[a-zA-Z0-9_-]{1,128}$/.test(next.journeyId) ||
		typeof next.beforeDayNumber !== 'number' ||
		!Number.isInteger(next.beforeDayNumber) ||
		next.beforeDayNumber < 0 ||
		next.beforeDayNumber > 77
	)
		throw new Error('Invalid reflection page.');
	return {
		entries: data.entries,
		nextCursor: {
			journeyId: next.journeyId,
			beforeDayNumber: next.beforeDayNumber,
		},
	};
};
