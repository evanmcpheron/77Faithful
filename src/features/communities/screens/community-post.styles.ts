import { BorderColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import type { TextStyle, ViewStyle } from 'react-native';

export const communityPostStyles = {
	content: {
		width: '100%',
		maxWidth: 720,
		alignSelf: 'center',
		gap: Spacing.Large,
	},
	section: { gap: Spacing.Small },
	cardContent: { gap: Spacing.Small },
	headingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		flexWrap: 'wrap',
		gap: Spacing.XSmall,
	},
	postText: { lineHeight: 26 },
	inlineActions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: Spacing.XSmall,
	},
	statusOptions: { gap: Spacing.XSmall },
	statusOption: {
		minHeight: 48,
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: BorderColors.Control,
		borderRadius: Radius.Medium,
		backgroundColor: SurfaceColors.Card,
		paddingHorizontal: Spacing.Small,
		paddingVertical: Spacing.XSmall,
	},
	selectedStatus: { backgroundColor: SurfaceColors.Accent },
	count: { textAlign: 'right' },
	separator: { height: Spacing.Small },
	footer: {
		width: '100%',
		maxWidth: 720,
		alignSelf: 'center',
		gap: Spacing.Large,
		paddingTop: Spacing.Large,
	},
} satisfies Record<string, ViewStyle | TextStyle>;
