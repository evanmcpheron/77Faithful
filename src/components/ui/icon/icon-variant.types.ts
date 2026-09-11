export const IconVariant = {
	Light: 'Light',
	Regular: 'Regular',
	Solid: 'Solid',
	Thin: 'Thin',
	Filled: 'Filled',
} as const;

export type TIconVariant = (typeof IconVariant)[keyof typeof IconVariant];
