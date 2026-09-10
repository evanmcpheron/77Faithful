export const BrandColors = {
	Primary: '#EDC764',
	Secondary: '#014940',
	SecondaryStrong: '#004C43',
	SecondaryDarker: '#00463E',
} as const;

export const NeutralColors = {
	White: '#FFFFFF',
	Grey050: '#FCFCFC',
	Grey100: '#F5F5F5',
	Grey200: '#E5E5E5',
	Grey300: '#D4D4D4',
	Grey400: '#A3A3A3',
	Grey500: '#737373',
	Grey600: '#525252',
	Grey700: '#404040',
	Grey800: '#262626',
	Grey900: '#1F1F1F',
	Black: '#000000',
} as const;

export const FeedbackColors = {
	Success: '#06C270',
	SuccessMuted: '#CDF3E2',
	Warning: '#FFCC00',
	WarningMuted: '#FFF5CC',
	Error: '#FF5943',
	ErrorMuted: '#FFDED9',
	Info: '#0063F7',
	InfoMuted: '#CCE0FD',
} as const;

export const SurfaceColors = {
	Screen: NeutralColors.White,
	Card: NeutralColors.Grey050,
	Muted: '#EFF6F6',
	Inverse: BrandColors.Secondary,
	Header: BrandColors.SecondaryStrong,
	HeaderGradientStart: '#00463E',
	HeaderGradientMiddle: '#F7FFFD',
	HeaderGradientEnd: 'transparent',
} as const;

export const TextColors = {
	Primary: '#092C4C',
	Secondary: BrandColors.Secondary,
	Muted: NeutralColors.Grey600,
	Disabled: NeutralColors.Grey400,
	Inverse: NeutralColors.White,
	Brand: BrandColors.Primary,
	Info: FeedbackColors.Info,
	Warning: FeedbackColors.Warning,
	Error: FeedbackColors.Error,
	Success: FeedbackColors.Success,
} as const;

export const BorderColors = {
	Default: '#D6E2E1',
	Subtle: '#E7F3F1',
	Muted: NeutralColors.Grey200,
	Focus: BrandColors.Primary,
	Inverse: '#0F685D',
	Error: FeedbackColors.Error,
} as const;

export const ActionColors = {
	PrimaryBackground: BrandColors.Primary,
	PrimaryContent: TextColors.Inverse,
	SecondaryBackground: BrandColors.Secondary,
	SecondaryContent: TextColors.Inverse,
	Link: FeedbackColors.Error,
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
