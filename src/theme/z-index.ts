export const ZIndex = {
	Zero: 0,
	Low: 10,
	Overlay: 40,
	Modal: 50,
	Toast: 60,
} as const;

export type TZIndex = (typeof ZIndex)[keyof typeof ZIndex];
