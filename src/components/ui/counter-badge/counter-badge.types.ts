export const CounterBadgeVariant = {
	Default: 'Default',
	Brand: 'Brand',
	Active: 'Active',
} as const;

export type TCounterBadgeVariant =
	(typeof CounterBadgeVariant)[keyof typeof CounterBadgeVariant];

export interface ICounterBadgeProps {
	count: number;
	maxCount?: number;
	variant?: TCounterBadgeVariant;
	accessibilityLabel?: string;
	testID?: string;
}
