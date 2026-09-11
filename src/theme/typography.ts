import { TextColors } from './colors';

export const TypographySize = {
	Display: 'Display',
	H1: 'H1',
	H2: 'H2',
	H3: 'H3',
	Body: 'Body',
	Body2: 'Body2',
} as const;

export type TTypographySize =
	(typeof TypographySize)[keyof typeof TypographySize];

export const TypographyWeight = {
	Regular: 'Regular',
	Medium: 'Medium',
	Semibold: 'Semibold',
	Bold: 'Bold',
} as const;

export type TTypographyWeight =
	(typeof TypographyWeight)[keyof typeof TypographyWeight];

export const TypographyTone = {
	Primary: 'Primary',
	Secondary: 'Secondary',
	Muted: 'Muted',
	Disabled: 'Disabled',
	Brand: 'Brand',
	Info: 'Info',
	Warning: 'Warning',
	Error: 'Error',
	Success: 'Success',
	Inverse: 'Inverse',
} as const;

export type TTypographyTone =
	(typeof TypographyTone)[keyof typeof TypographyTone];

export const TypographyColors = {
	Primary: TextColors.Primary,
	Secondary: TextColors.Secondary,
	Muted: TextColors.Muted,
	Disabled: TextColors.Disabled,
	Brand: TextColors.Brand,
	Info: TextColors.Info,
	Warning: TextColors.Warning,
	Error: TextColors.Error,
	Success: TextColors.Success,
	Inverse: TextColors.Inverse,
} satisfies Record<TTypographyTone, string>;

export type TTypographyVariant = TTypographyTone;
export const TypographyVariant = TypographyTone;

interface ITypographyStyleMeta {
	Size: number;
	LineHeight: number;
	Weight: number;
}

export const TypographyStyles = {
	Display: {
		Size: 26,
		LineHeight: 36,
		Weight: 700,
	},
	H1: {
		Size: 18,
		LineHeight: 24,
		Weight: 0,
	},
	H2: {
		Size: 16,
		LineHeight: 24,
		Weight: 0,
	},
	H3: {
		Size: 14,
		LineHeight: 24,
		Weight: 0,
	},
	Body: {
		Size: 14,
		LineHeight: 24,
		Weight: 700,
	},
	Body2: {
		Size: 14,
		LineHeight: 24,
		Weight: 600,
	},
} satisfies Record<TTypographySize, ITypographyStyleMeta>;
