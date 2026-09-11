import type { Firestore, Transaction } from 'firebase-admin/firestore';
import type { TBibleVersionId } from '../../generated/types/formation/bible-version.types';
import type { ITodayVerses } from '../../generated/types/formation/today-verse.types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;
const isText = (value: unknown): value is string =>
	typeof value === 'string' && value.trim().length > 0;

export const readTodayVerses = async (
	transaction: Transaction,
	database: Firestore,
	dayNumber: number,
	bibleVersionId: TBibleVersionId,
): Promise<ITodayVerses | null> => {
	const reference = database.doc(`todayVerseDays/${dayNumber}`);
	const assignment: unknown = (await transaction.get(reference)).data();
	if (
		!isRecord(assignment) ||
		assignment.schemaVersion !== 1 ||
		assignment.dayNumber !== dayNumber ||
		!isText(assignment.top) ||
		!isText(assignment.bottom) ||
		assignment.top === assignment.bottom
	)
		return null;
	const translation: unknown = (
		await transaction.get(
			reference.collection('translations').doc(bibleVersionId),
		)
	).data();
	const source = isRecord(translation) ? translation.source : undefined;
	const sourceIsCurrent =
		source === undefined ||
		(isRecord(source) &&
			source.provider === 'API.Bible' &&
			source.available === true &&
			isText(source.copyright) &&
			typeof source.verifiedAt === 'string' &&
			Date.parse(source.verifiedAt) <= Date.now() &&
			Date.now() - Date.parse(source.verifiedAt) < 30 * 86400000);
	const resolve = (slot: 'top' | 'bottom', verse: string) => {
		const value =
			isRecord(translation) &&
			translation.schemaVersion === 1 &&
			translation.bibleVersionId === bibleVersionId
				? translation[slot]
				: null;
		return {
			verse,
			...(isRecord(value) && isText(value.sourceReference)
				? { displayReference: value.sourceReference }
				: {}),
			text:
				sourceIsCurrent &&
				isRecord(value) &&
				value.verse === verse &&
				isText(value.text)
					? value.text
					: null,
		};
	};
	return {
		...(isRecord(source) && sourceIsCurrent && isText(source.copyright)
			? {
					copyright: source.copyright,
					providerUrl: 'https://api.bible' as const,
				}
			: {}),
		top: resolve('top', assignment.top),
		bottom: resolve('bottom', assignment.bottom),
	};
};
