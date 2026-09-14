import { TextColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { TextStyle, ViewStyle } from 'react-native';

export const invitePeopleStyles = {
	content: {
		width: '100%',
		maxWidth: 640,
		alignSelf: 'center',
		gap: Spacing.Large,
	},
	section: { gap: Spacing.Small },
	compact: { gap: Spacing.XSmall },
	actions: { gap: Spacing.Small },
	code: {
		color: TextColors.Primary,
		fontSize: 24,
		fontWeight: '600',
		letterSpacing: 1.5,
		lineHeight: 36,
		textAlign: 'center',
	},
} satisfies Record<string, ViewStyle | TextStyle>;
