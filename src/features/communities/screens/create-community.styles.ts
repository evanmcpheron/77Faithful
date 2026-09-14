import { Platform, type TextStyle, type ViewStyle } from 'react-native';

import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';

export const createCommunityStyles = {
	content: {
		width: '100%',
		maxWidth: 460,
		alignSelf: 'center',
		gap: Spacing.Large,
	},
	intro: { gap: Spacing.XSmall, marginBottom: Spacing.XSmall },
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
	description: { fontSize: 16, lineHeight: 24, marginTop: Spacing.XSmall },
	privacy: { gap: Spacing.Small },
	row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.Small },
	icon: {
		width: Spacing.XLarge,
		height: Spacing.XLarge,
		borderRadius: Radius.Full,
		backgroundColor: SurfaceColors.Muted,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardCopy: { flex: 1, minWidth: 0 },
	actions: { gap: Spacing.Small },
} satisfies Record<string, ViewStyle | TextStyle>;
