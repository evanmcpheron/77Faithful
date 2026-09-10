export const Spacing = {
	XXSmall: 4,
	XSmall: 8,
	Small: 16,
	Medium: 24,
	Large: 32,
	XLarge: 40,
	XXLarge: 56,
	XXXLarge: 72,
	Huge: 80,
	XHuge: 96,
	XXHuge: 120,
} as const;

export type TSpacing = (typeof Spacing)[keyof typeof Spacing];
export type TSize = TSpacing;
