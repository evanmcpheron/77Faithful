export const IconSizes = {
	Small: 18,
	Medium: 24,
	Large: 28,
	XLarge: 32,
	XXLarge: 60,
	Huge: 100,
	Navigation: 24,
	NavigationActive: 26,
} as const;

export type TIconSize = (typeof IconSizes)[keyof typeof IconSizes];

export const IconStrokeWidths = {
	Thin: 1,
	Regular: 2.5,
	Thick: 4,
} as const;

export type TIconStrokeWidth =
	(typeof IconStrokeWidths)[keyof typeof IconStrokeWidths];
