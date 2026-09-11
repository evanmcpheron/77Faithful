import { WeeklyThemeColors } from '@td/theme/weekly-theme-colors';
import {
	FormationThemeId,
	type IFormationWeekOverviewDocument,
} from '@td/types/formation/formation-course.types';

// Approved overview order; this does not alter published course versions.
export const WEEKLY_THEMES = [
	{
		themeId: FormationThemeId.AbidingInChrist,
		title: 'Abiding in Christ',
		description: 'Rest, trust, and stay connected',
		color: WeeklyThemeColors.Sage,
	},
	{
		themeId: FormationThemeId.Scripture,
		title: 'Scripture',
		description: 'God’s living and active Word',
		color: WeeklyThemeColors.Slate,
	},
	{
		themeId: FormationThemeId.Prayer,
		title: 'Prayer',
		description: 'A deeper conversation',
		color: WeeklyThemeColors.Stone,
	},
	{
		themeId: FormationThemeId.Renewal,
		title: 'Renewal',
		description: 'New life in Christ',
		color: WeeklyThemeColors.Clay,
	},
	{
		themeId: FormationThemeId.Identity,
		title: 'Identity in Christ',
		description: 'Who you are in Him',
		color: WeeklyThemeColors.Olive,
	},
	{
		themeId: FormationThemeId.Love,
		title: 'Love',
		description: 'God’s love changes everything',
		color: WeeklyThemeColors.Earth,
	},
	{
		themeId: FormationThemeId.Service,
		title: 'Service',
		description: 'A life that reflects Jesus',
		color: WeeklyThemeColors.Sand,
	},
	{
		themeId: FormationThemeId.Stewardship,
		title: 'Stewardship',
		description: 'All of life belongs to God',
		color: WeeklyThemeColors.Forest,
	},
	{
		themeId: FormationThemeId.ChristianCommunity,
		title: 'Christian Community',
		description: 'Together in faith',
		color: WeeklyThemeColors.Slate,
	},
	{
		themeId: FormationThemeId.Mission,
		title: 'Mission',
		description: 'Living with eternal purpose',
		color: WeeklyThemeColors.Linen,
	},
	{
		themeId: FormationThemeId.Perseverance,
		title: 'Perseverance',
		description: 'Finish well',
		color: WeeklyThemeColors.Taupe,
	},
] as const satisfies readonly (Pick<
	IFormationWeekOverviewDocument,
	'themeId' | 'title' | 'description'
> & { readonly color: string })[];
