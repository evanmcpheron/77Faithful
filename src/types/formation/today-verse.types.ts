import type { TBibleVersionId } from './bible-version.types';

/** todayVerseDays/{dayNumber}; independent of the day's assigned reading. */
export interface ITodayVerseDayDocument {
	readonly schemaVersion: 1;
	readonly dayNumber: number;
	readonly top: string;
	readonly bottom: string;
}

/** todayVerseDays/{dayNumber}/translations/{bibleVersionId}. */
export interface ITodayVerseTranslationDocument {
	readonly schemaVersion: 1;
	readonly bibleVersionId: TBibleVersionId;
	readonly top: ITodayVerseExcerpt;
	readonly bottom: ITodayVerseExcerpt;
	readonly source?: {
		readonly provider: 'API.Bible';
		readonly bibleId: string;
		readonly verifiedAt: string;
		readonly copyright: string;
		readonly available: boolean;
	};
}

export interface ITodayVerseExcerpt {
	readonly verse: string;
	readonly text: string;
	readonly sourceId?: string;
	readonly sourceReference?: string;
}

export interface ITodayVerses {
	readonly copyright?: string;
	readonly providerUrl?: 'https://api.bible';
	readonly top: {
		readonly verse: string;
		readonly text: string | null;
		readonly displayReference?: string;
	};
	readonly bottom: {
		readonly verse: string;
		readonly text: string | null;
		readonly displayReference?: string;
	};
}
