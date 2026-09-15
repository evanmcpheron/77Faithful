import { BorderColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import type { TextStyle, ViewStyle } from 'react-native';

export const composePostStyles = {
	content: {
		width: '100%',
		maxWidth: 640,
		alignSelf: 'center',
		gap: Spacing.Large,
	},
	section: { gap: Spacing.Small },
	typeList: { gap: Spacing.XSmall },
	typeOption: {
		minHeight: 56,
		borderWidth: 1,
		borderColor: BorderColors.Default,
		borderRadius: Radius.Medium,
		backgroundColor: SurfaceColors.Card,
		padding: Spacing.Small,
		justifyContent: 'center',
	},
	selectedType: { backgroundColor: SurfaceColors.Muted },
	audience: { gap: Spacing.XSmall },
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: Spacing.Small,
	},
	count: { textAlign: 'right' },
	actions: { gap: Spacing.Small },
} satisfies Record<string, ViewStyle | TextStyle>;
