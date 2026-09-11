export const Radius = {
	XSmall: 4,
	Small: 8,
	Medium: 16,
	Large: 20,
	XLarge: 30,
	XXLarge: 45,
	Full: 60,
} as const;

export type TRadius = (typeof Radius)[keyof typeof Radius];
