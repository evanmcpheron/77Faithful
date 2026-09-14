import { BorderColors, TextColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import { Platform } from 'react-native';
import styled from 'styled-components/native';

export const StyledOverviewBody = styled.View({
	gap: Spacing.Medium,
	paddingHorizontal: Spacing.XSmall,
	paddingBottom: Spacing.Small,
});
export const StyledOverviewSection = styled.View({ gap: Spacing.Small });
export const StyledOverviewRule = styled.View({
	width: Spacing.Huge,
	height: 1,
	backgroundColor: BorderColors.Control,
});
export const overviewTextStyles = {
	label: {
		fontSize: 12,
		lineHeight: 18,
		letterSpacing: 2,
		color: TextColors.Secondary,
	},
	title: {
		fontFamily: Platform.select({
			ios: 'Georgia',
			android: 'serif',
			default: 'Georgia',
		}),
		fontSize: 32,
		lineHeight: 40,
		fontWeight: '400',
	},
	body: { fontSize: 16, lineHeight: 26 },
} as const;
