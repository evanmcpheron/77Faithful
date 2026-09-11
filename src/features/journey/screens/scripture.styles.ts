import { StyledCard } from '@td/components/ui/card/card.styles';
import { NeutralColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { TypographyStyles } from '@td/theme/typography';
import { Image } from 'expo-image';
import { Platform, View } from 'react-native';
import styled from 'styled-components/native';

export const ReadingColumn = styled(View)({
	width: '100%',
	maxWidth: 640,
	alignSelf: 'center',
	gap: Spacing.Large,
});
export const ScriptureLeaf = styled(Image)({
	width: Spacing.Huge,
	height: Spacing.Huge,
});
export const ScriptureQuote = styled(StyledCard)({
	backgroundColor: NeutralColors.Grey200,
});
export const ReadingTitle = styled(View)({
	alignItems: 'center',
	gap: Spacing.Small,
	paddingTop: Spacing.Small,
	paddingBottom: Spacing.Small,
});
export const VerseRow = styled(View)<{ $highlighted: boolean }>(
	({ $highlighted }) => ({
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: Spacing.Small,
		padding: Spacing.XSmall,
		borderRadius: Radius.Small,
		backgroundColor: $highlighted ? SurfaceColors.Accent : 'transparent',
	}),
);
export const VerseText = styled(View)({ flex: 1 });
export const PassageSection = styled(View)({ gap: Spacing.Small });
export const ReadingActions = styled(View)({
	flexDirection: 'row',
	flexWrap: 'wrap',
	justifyContent: 'space-around',
	gap: Spacing.Small,
});
export const ReadingAction = styled(View)({
	flex: 1,
	alignItems: 'center',
	gap: Spacing.Small,
});
const fontFamily = Platform.select({
	ios: 'Georgia',
	android: 'serif',
	default: 'Georgia, serif',
});
export const scriptureTextStyle = {
	fontFamily,
	fontSize: TypographyStyles.H1.Size,
	lineHeight: Spacing.Large,
};
export const scriptureTitleStyle = { fontFamily };
export const scriptureHeroStyle = {
	fontFamily,
	fontSize: 40,
	lineHeight: 48,
};
export const quoteStyle = {
	...scriptureTextStyle,
	fontStyle: 'italic' as const,
};
