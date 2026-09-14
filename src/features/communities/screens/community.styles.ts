import { Spacing } from '@td/theme/spacing';
import type { ViewStyle } from 'react-native';

export const communityStyles = {
	content: {
		width: '100%',
		maxWidth: 640,
		alignSelf: 'center',
		gap: Spacing.Large,
	},
	section: { gap: Spacing.Small },
	details: { gap: Spacing.XSmall },
	actions: { gap: Spacing.Small },
} satisfies Record<string, ViewStyle>;
