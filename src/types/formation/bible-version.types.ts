import type {
	IDocumentTimestamps,
	IPersistedTimestamp,
} from '../shared/persistence.types';

export const BibleVersionId = {
	NewAmericanStandardBible2020: 'Nasb2020',
	NewInternationalVersion: 'Niv',
	NewLivingTranslation: 'Nlt',
	EnglishStandardVersion: 'Esv',
	TheMessage: 'Msg',
	KingJamesVersion: 'Kjv',
	NewKingJamesVersion: 'Nkjv',
	ChristianStandardBible: 'Csb',
	WorldEnglishBible: 'Web',
} as const;

export type TBibleVersionId =
	(typeof BibleVersionId)[keyof typeof BibleVersionId];

export interface IBibleVersionDefinition {
	readonly bibleVersionId: TBibleVersionId;
	readonly abbreviation: string;
	readonly name: string;
	readonly edition: string | null;
}

/** The intended catalog is display metadata, not authorization to publish these texts. */
export const BibleVersion = {
	NewAmericanStandardBible2020: {
		bibleVersionId: BibleVersionId.NewAmericanStandardBible2020,
		abbreviation: 'NASB 2020',
		name: 'New American Standard Bible 2020',
		edition: '2020',
	},
	NewInternationalVersion: {
		bibleVersionId: BibleVersionId.NewInternationalVersion,
		abbreviation: 'NIV',
		name: 'New International Version',
		edition: null,
	},
	NewLivingTranslation: {
		bibleVersionId: BibleVersionId.NewLivingTranslation,
		abbreviation: 'NLT',
		name: 'New Living Translation',
		edition: null,
	},
	EnglishStandardVersion: {
		bibleVersionId: BibleVersionId.EnglishStandardVersion,
		abbreviation: 'ESV',
		name: 'English Standard Version',
		edition: null,
	},
	TheMessage: {
		bibleVersionId: BibleVersionId.TheMessage,
		abbreviation: 'MSG',
		name: 'The Message',
		edition: null,
	},
	KingJamesVersion: {
		bibleVersionId: BibleVersionId.KingJamesVersion,
		abbreviation: 'KJV',
		name: 'King James Version',
		edition: null,
	},
	NewKingJamesVersion: {
		bibleVersionId: BibleVersionId.NewKingJamesVersion,
		abbreviation: 'NKJV',
		name: 'New King James Version',
		edition: null,
	},
	ChristianStandardBible: {
		bibleVersionId: BibleVersionId.ChristianStandardBible,
		abbreviation: 'CSB',
		name: 'Christian Standard Bible',
		edition: null,
	},
	WorldEnglishBible: {
		bibleVersionId: BibleVersionId.WorldEnglishBible,
		abbreviation: 'WEB',
		name: 'World English Bible',
		edition: null,
	},
} as const satisfies Record<
	keyof typeof BibleVersionId,
	IBibleVersionDefinition
>;

export type TBibleVersion = (typeof BibleVersion)[keyof typeof BibleVersion];

export const BibleVersionReleaseStatus = {
	PendingReview: 'PendingReview',
	Released: 'Released',
	Withdrawn: 'Withdrawn',
} as const;

export type TBibleVersionReleaseStatus =
	(typeof BibleVersionReleaseStatus)[keyof typeof BibleVersionReleaseStatus];

/** One exact text edition, identified by bibleTextEditionId in its document path. */
export interface IBibleTextEditionDocument extends IDocumentTimestamps {
	readonly bibleVersionId: TBibleVersionId;
	readonly editionName: string;
	readonly sourceRevision: string;
	readonly acknowledgments: readonly string[];
	readonly releaseState: TBibleVersionReleaseState;
}

export interface IBibleVersionPendingReviewState {
	readonly status: typeof BibleVersionReleaseStatus.PendingReview;
}

export interface IBibleVersionReleasedState {
	readonly status: typeof BibleVersionReleaseStatus.Released;
	readonly releasedAt: IPersistedTimestamp;
}

export interface IBibleVersionWithdrawnState {
	readonly status: typeof BibleVersionReleaseStatus.Withdrawn;
	readonly withdrawnAt: IPersistedTimestamp;
	readonly availabilityExplanation: string;
}

export type TBibleVersionReleaseState =
	| IBibleVersionPendingReviewState
	| IBibleVersionReleasedState
	| IBibleVersionWithdrawnState;
