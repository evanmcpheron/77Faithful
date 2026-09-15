import { Platform, type TextStyle, type ViewStyle } from 'react-native';

import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';

export const joinCommunityStyles = {
	content: {
		width: '100%',
		maxWidth: 520,
		alignSelf: 'center',
		gap: Spacing.Large,
	},
	intro: { gap: Spacing.XSmall },
	eyebrow: { letterSpacing: 2 },
	title: {
		fontFamily: Platform.select({
			ios: 'Georgia',
			android: 'serif',
			default: 'Georgia, serif',
		}),
		fontSize: 34,
		lineHeight: 40,
	},
	formSection: { gap: Spacing.Small },
	previewDetails: { gap: Spacing.Small },
	detailGroup: { gap: Spacing.XXSmall },
	scheduleCard: {
		gap: Spacing.XSmall,
		padding: Spacing.Small,
		borderRadius: Radius.Medium,
		backgroundColor: SurfaceColors.Muted,
	},
	privacyCard: {
		gap: Spacing.XSmall,
		padding: Spacing.Small,
		borderRadius: Radius.Medium,
		backgroundColor: SurfaceColors.Accent,
	},
	actions: { gap: Spacing.Small },
} satisfies Record<string, ViewStyle | TextStyle>;
