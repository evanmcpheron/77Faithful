import { Spacing } from '@td/theme/spacing';
import type { ViewStyle } from 'react-native';

export const practiceSettingsStyles = {
	guidanceTrigger: {
		minHeight: Spacing.Large + Spacing.Small,
		gap: Spacing.XSmall,
	},
} satisfies Record<string, ViewStyle>;
