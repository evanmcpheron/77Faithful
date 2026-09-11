import { Spacing } from '@td/theme/spacing';
import type { ViewStyle } from 'react-native';

export const accountStyles = {
	column: {
		width: '100%',
		maxWidth: 460,
		alignSelf: 'center',
		gap: Spacing.Large,
	},
	section: { gap: Spacing.Small },
	heading: { gap: Spacing.XSmall },
} satisfies Record<string, ViewStyle>;
