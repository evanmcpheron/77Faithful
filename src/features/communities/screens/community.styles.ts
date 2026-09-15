import { Spacing } from '@td/theme/spacing';
import type { TextStyle, ViewStyle } from 'react-native';

export const communityStyles = {
	content: {
		width: '100%',
		maxWidth: 640,
		alignSelf: 'center',
		gap: Spacing.Large,
		paddingBottom: Spacing.Medium,
	},
	section: { gap: Spacing.Small },
	details: { gap: Spacing.XSmall },
	actions: { gap: Spacing.Small },
	navigationActions: { gap: Spacing.Small },
	cardContent: { gap: Spacing.Small },
	cardHeading: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'baseline',
		justifyContent: 'space-between',
		gap: Spacing.XSmall,
	},
	cardHeadingText: { flexShrink: 1 },
	cardMeta: { gap: Spacing.XXSmall },
	separator: { height: Spacing.Small },
	footer: { gap: Spacing.Small, paddingVertical: Spacing.Large },
	postText: { flexShrink: 1 },
} satisfies Record<string, ViewStyle | TextStyle>;
