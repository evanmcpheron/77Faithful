import type { TBibleVersionId } from '../formation/bible-version.types';
import type {
	IDocumentTimestamps,
	TDomainSchemaVersion,
} from '../shared/persistence.types';

/** Private auth-provider projection; contact data is not duplicated into a profile document. */
export interface IAuthenticatedAccountIdentity {
	readonly userId: string;
	readonly contactEmail: string | null;
	readonly isEmailConfirmed: boolean;
}

/** userId is the document-path ID. This is never a community member projection. */
export interface IUserProfileDocument extends IDocumentTimestamps {
	readonly schemaVersion: TDomainSchemaVersion;
	readonly revision: number;
	readonly preferredName: string | null;
}

export const AppearancePreference = {
	System: 'System',
	Light: 'Light',
	Dark: 'Dark',
} as const;

export type TAppearancePreference =
	(typeof AppearancePreference)[keyof typeof AppearancePreference];

/** Keyed by userId in its path; excludes phone schedules and operating-system permission. */
export interface IUserPreferencesDocument extends IDocumentTimestamps {
	readonly schemaVersion: TDomainSchemaVersion;
	readonly revision: number;
	readonly bibleVersionId: TBibleVersionId | null;
	readonly appearance: TAppearancePreference;
	/** Positive app reading multiplier; it must continue to honor system accessibility scaling. */
	readonly textSizeMultiplier: number;
}

export interface IUpdatePreferredNameRequest {
	readonly operationId: string;
	readonly expectedRevision: number;
	readonly preferredName: string | null;
}

export interface IChangeBibleVersionPreferenceRequest {
	readonly operationId: string;
	readonly expectedRevision: number;
	readonly bibleVersionId: TBibleVersionId;
}

export interface IChangeAppearancePreferenceRequest {
	readonly operationId: string;
	readonly expectedRevision: number;
	readonly appearance: TAppearancePreference;
}

export interface IChangeTextSizePreferenceRequest {
	readonly operationId: string;
	readonly expectedRevision: number;
	readonly textSizeMultiplier: number;
}
