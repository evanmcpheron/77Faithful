// Quiet Sanctuary light palette. The library currently consumes static tokens.
export const BrandColors = {
	Primary: '#294F42',
	Secondary: '#294F42',
	SecondaryStrong: '#203D34',
	SecondaryDarker: '#1E3D32',
} as const;

// Retain the existing neutral exports for compatibility, using warm palette values.
export const NeutralColors = {
	White: '#FFFEFC',
	Grey050: '#F6F3EE',
	Grey100: '#F2F0EA',
	Grey200: '#E4E2DA',
	Grey300: '#EEEAE3',
	Grey400: '#838A82',
	Grey500: '#6B706A',
	Grey600: '#616963',
	Grey700: '#203D34',
	Grey800: '#1E3D32',
	Grey900: '#17231F',
	Black: '#17231F',
} as const;

// Feedback uses the guide's sage, ochre, clay, and slate accent pairs.
export const FeedbackColors = {
	Success: '#294F42',
	SuccessMuted: '#DCE5DD',
	Warning: '#785A20',
	WarningMuted: '#EBD8AF',
	Error: '#7B4D44',
	ErrorMuted: '#E7D5D1',
	Info: '#365462',
	InfoMuted: '#D9E0E4',
} as const;

export const SurfaceColors = {
	Screen: NeutralColors.Grey050,
	Card: NeutralColors.White,
	Elevated: NeutralColors.Grey100,
	Muted: '#EEEAE3',
	Accent: FeedbackColors.SuccessMuted,
	Inverse: BrandColors.Secondary,
	Header: BrandColors.SecondaryStrong,
	HeaderGradientStart: NeutralColors.Grey100,
	HeaderGradientMiddle: NeutralColors.Grey050,
	HeaderGradientEnd: NeutralColors.Grey050,
} as const;

export const TextColors = {
	Primary: '#203D34',
	Secondary: '#616963',
	Muted: '#6B706A',
	Disabled: NeutralColors.Grey400,
	Inverse: NeutralColors.White,
	Brand: BrandColors.Primary,
	Info: FeedbackColors.Info,
	Warning: FeedbackColors.Warning,
	Error: FeedbackColors.Error,
	Success: FeedbackColors.Success,
} as const;

export const BorderColors = {
	Default: '#E4E2DA',
	Subtle: '#E4E2DA',
	Muted: NeutralColors.Grey200,
	Control: '#838A82',
	Focus: '#365F4B',
	Inverse: '#8B9B8E',
	Error: FeedbackColors.Error,
} as const;

export const ActionColors = {
	PrimaryBackground: BrandColors.Primary,
	PrimaryPressed: BrandColors.SecondaryDarker,
	PrimaryContent: TextColors.Inverse,
	SecondaryBackground: SurfaceColors.Accent,
	SecondaryContent: TextColors.Brand,
	Link: BrandColors.Primary,
	DisabledOpacity: 0.5,
} as const;

export const Colors = {
	ActionColors,
	BorderColors,
	BrandColors,
	FeedbackColors,
	NeutralColors,
	SurfaceColors,
	TextColors,
} as const;
