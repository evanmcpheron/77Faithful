export const FoundationalPracticeId = {
	ReadScripture: 'ReadScripture',
	Pray: 'Pray',
	Reflect: 'Reflect',
} as const;

export type TFoundationalPracticeId =
	(typeof FoundationalPracticeId)[keyof typeof FoundationalPracticeId];

export const OptionalPracticeId = {
	Movement: 'Movement',
	ServeOrEncourage: 'ServeOrEncourage',
	ScriptureMemorization: 'ScriptureMemorization',
	Gratitude: 'Gratitude',
	ChristianReading: 'ChristianReading',
	Worship: 'Worship',
	Generosity: 'Generosity',
	FamilyOrHouseholdDevotion: 'FamilyOrHouseholdDevotion',
	IntentionalDiscipline: 'IntentionalDiscipline',
	IntentionalWitness: 'IntentionalWitness',
} as const;

export type TOptionalPracticeId =
	(typeof OptionalPracticeId)[keyof typeof OptionalPracticeId];
export type TPracticeId = TFoundationalPracticeId | TOptionalPracticeId;

/** Choose two to four distinct practices; validate uniqueness at save and confirmation boundaries. */
export type TOptionalPracticeSelection =
	| readonly [TOptionalPracticeId, TOptionalPracticeId]
	| readonly [TOptionalPracticeId, TOptionalPracticeId, TOptionalPracticeId]
	| readonly [
			TOptionalPracticeId,
			TOptionalPracticeId,
			TOptionalPracticeId,
			TOptionalPracticeId,
	  ];

export type TAssignedDailyPracticeIds = readonly [
	typeof FoundationalPracticeId.ReadScripture,
	typeof FoundationalPracticeId.Pray,
	typeof FoundationalPracticeId.Reflect,
	...TOptionalPracticeSelection,
];

export interface IPracticeDefinition {
	readonly practiceId: TPracticeId;
	readonly name: string;
	readonly purpose: string;
	readonly examples: readonly string[];
	readonly boundaries: string;
}
