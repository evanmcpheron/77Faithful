export const Layout = {
	AuthHeaderHeight: 265,
	MainHeaderHeight: 265,
	ScreenHorizontalPadding: 16,
	BottomNavigationHeight: 76,
} as const;

export type TLayout = (typeof Layout)[keyof typeof Layout];
