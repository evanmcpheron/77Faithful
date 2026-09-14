import { Spacing } from '@td/theme/spacing';
import type { ViewStyle } from 'react-native';

export const communityMemberStyles = {
	content: {
		width: '100%',
		maxWidth: 640,
		alignSelf: 'center',
		gap: Spacing.Large,
		paddingBottom: Spacing.Medium,
	},
	section: { gap: Spacing.Small },
	actions: { gap: Spacing.XSmall },
	separator: { height: Spacing.Small },
	footer: { gap: Spacing.Small, paddingVertical: Spacing.Large },
} satisfies Record<string, ViewStyle>;
