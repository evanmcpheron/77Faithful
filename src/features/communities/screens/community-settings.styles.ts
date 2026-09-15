import { Spacing } from '@td/theme/spacing';
import type { ViewStyle } from 'react-native';

export const communitySettingsStyles = {
	content: {
		width: '100%',
		maxWidth: 640,
		alignSelf: 'center',
		gap: Spacing.Large,
	},
	section: { gap: Spacing.Small },
	fields: { gap: Spacing.XSmall },
	actions: { gap: Spacing.Small },
} satisfies Record<string, ViewStyle>;
