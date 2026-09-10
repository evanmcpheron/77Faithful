import type {
	IDocumentTimestamps,
	IPersistedTimestamp,
	TDomainSchemaVersion,
} from '../shared/persistence.types';

export const FormationStructure = {
	DayCount: 77,
	WeekCount: 11,
	DaysPerWeek: 7,
	MinimumPracticesPerDay: 5,
	MaximumPracticesPerDay: 7,
} as const;

export const FormationThemeId = {
	AbidingInChrist: 'AbidingInChrist',
	Scripture: 'Scripture',
	Prayer: 'Prayer',
	Renewal: 'Renewal',
	Identity: 'Identity',
	Love: 'Love',
	Service: 'Service',
	Stewardship: 'Stewardship',
	ChristianCommunity: 'ChristianCommunity',
	Mission: 'Mission',
	Perseverance: 'Perseverance',
} as const;

export type TFormationThemeId =
	(typeof FormationThemeId)[keyof typeof FormationThemeId];

export const FormationThemeOrder = [
	FormationThemeId.AbidingInChrist,
	FormationThemeId.Scripture,
	FormationThemeId.Prayer,
	FormationThemeId.Renewal,
	FormationThemeId.Identity,
	FormationThemeId.Love,
	FormationThemeId.Service,
	FormationThemeId.Stewardship,
	FormationThemeId.ChristianCommunity,
	FormationThemeId.Mission,
	FormationThemeId.Perseverance,
] as const;

export const FormationPublicationStatus = {
	Draft: 'Draft',
	Published: 'Published',
	Withdrawn: 'Withdrawn',
} as const;

export type TFormationPublicationStatus =
	(typeof FormationPublicationStatus)[keyof typeof FormationPublicationStatus];

export interface IFormationCourseReference {
	readonly courseId: string;
	readonly courseVersionId: string;
}

export interface IFormationDayContentReference extends IFormationCourseReference {
	readonly dayContentId: string;
}

/** courseId is the document-path ID. Versions and manuscripts are separate documents. */
export interface IFormationCourseDocument extends IDocumentTimestamps {
	readonly schemaVersion: TDomainSchemaVersion;
	readonly title: string;
	readonly description: string;
}

/** Published versions are immutable; ordinary editorial changes create a new version. */
export interface IFormationCourseVersionDocument extends IDocumentTimestamps {
	readonly schemaVersion: TDomainSchemaVersion;
	readonly courseId: string;
	readonly dayCount: typeof FormationStructure.DayCount;
	readonly weekCount: typeof FormationStructure.WeekCount;
	readonly publicationState: TFormationPublicationState;
}

export interface IFormationDraftState {
	readonly status: typeof FormationPublicationStatus.Draft;
}

export interface IFormationPublishedState {
	readonly status: typeof FormationPublicationStatus.Published;
	readonly publishedAt: IPersistedTimestamp;
}

export interface IFormationWithdrawnState {
	readonly status: typeof FormationPublicationStatus.Withdrawn;
	readonly withdrawnAt: IPersistedTimestamp;
	readonly availabilityExplanation: string;
}

export type TFormationPublicationState =
	IFormationDraftState | IFormationPublishedState | IFormationWithdrawnState;

/** Safe from setup onward; weekNumber is validated as 1–11 in the settled theme order. */
export interface IFormationWeekOverviewDocument extends IFormationCourseReference {
	readonly weekNumber: number;
	readonly themeId: TFormationThemeId;
	readonly title: string;
	readonly description: string;
}

/** Kept separate because full introductions are only available after their week begins. */
export interface IFormationWeekIntroductionDocument extends IFormationCourseReference {
	readonly weekNumber: number;
	readonly themeId: TFormationThemeId;
	readonly introduction: string;
}

/** dayContentId identifies immutable content; validate day 1–77 and its matching week/theme. */
export interface IFormationDayContentDocument extends IFormationCourseReference {
	readonly dayNumber: number;
	readonly weekNumber: number;
	readonly themeId: TFormationThemeId;
	readonly title: string;
	readonly scriptureAssignmentId: string;
	readonly devotional: string;
	readonly prayerPrompt: string;
	readonly writtenPrayer: string;
	readonly reflectionQuestion: string;
	readonly intentionInvitation: string | null;
}

export const FormationCorrectionReason = {
	Factual: 'Factual',
	Theological: 'Theological',
	Safety: 'Safety',
	Rights: 'Rights',
} as const;

export type TFormationCorrectionReason =
	(typeof FormationCorrectionReason)[keyof typeof FormationCorrectionReason];

export const FormationCorrectionTargetKind = {
	DailyContent: 'DailyContent',
	WeeklyIntroduction: 'WeeklyIntroduction',
	ScriptureText: 'ScriptureText',
} as const;

export type TFormationCorrectionTargetKind =
	(typeof FormationCorrectionTargetKind)[keyof typeof FormationCorrectionTargetKind];

export interface IDailyContentCorrectionTarget extends IFormationCourseReference {
	readonly kind: typeof FormationCorrectionTargetKind.DailyContent;
	readonly dayContentId: string;
	readonly replacementDayContentId: string | null;
}

export interface IWeeklyIntroductionCorrectionTarget extends IFormationCourseReference {
	readonly kind: typeof FormationCorrectionTargetKind.WeeklyIntroduction;
	readonly weekIntroductionId: string;
	readonly replacementWeekIntroductionId: string | null;
}

export interface IScriptureTextCorrectionTarget {
	readonly kind: typeof FormationCorrectionTargetKind.ScriptureText;
	readonly scriptureAssignmentTextId: string;
	readonly replacementScriptureAssignmentTextId: string | null;
}

export type TFormationCorrectionTarget =
	| IDailyContentCorrectionTarget
	| IWeeklyIntroductionCorrectionTarget
	| IScriptureTextCorrectionTarget;

/** A null replacement means unavailable; consumers must honor safety/rights withdrawals. */
export interface IFormationContentCorrectionDocument {
	readonly target: TFormationCorrectionTarget;
	readonly reason: TFormationCorrectionReason;
	readonly explanation: string;
	readonly issuedAt: IPersistedTimestamp;
}
