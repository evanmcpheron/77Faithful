import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { TypographyStyles } from '@td/theme/typography';
import styled from 'styled-components/native';
import { scriptureHeroStyle, scriptureTitleStyle } from './scripture.styles';

export const GenerositySections = styled.View({ gap: Spacing.Medium });
export const GenerosityHeading = styled.View({ gap: Spacing.XSmall });
export const GenerosityRow = styled.View({
	flexDirection: 'row',
	alignItems: 'center',
	gap: Spacing.Small,
});
export const GenerosityCopy = styled.View({ flex: 1 });
export const GenerosityIconCircle = styled.View({
	width: Spacing.XXLarge,
	height: Spacing.XXLarge,
	borderRadius: Radius.Full,
	backgroundColor: SurfaceColors.Accent,
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
});
export const GenerosityExamples = styled.View({
	gap: Spacing.Medium,
	paddingBottom: Spacing.XSmall,
});
export const GenerosityNotice = styled.View({
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: Spacing.Small,
	padding: Spacing.Small,
	borderRadius: Radius.Large,
	backgroundColor: SurfaceColors.Accent,
});
export const GenerosityDecoration = styled.View({ flexShrink: 0 });
export const generosityTitleStyle = scriptureHeroStyle;
export const generosityBodyStyle = {
	...scriptureTitleStyle,
	fontSize: TypographyStyles.H1.Size,
	lineHeight: TypographyStyles.H1.LineHeight,
};
export const generosityExampleStyle = {
	...scriptureTitleStyle,
	fontSize: TypographyStyles.H2.Size,
	lineHeight: TypographyStyles.H2.LineHeight,
};
export const generositySectionStyle = {
	...scriptureTitleStyle,
	fontSize: Spacing.Medium,
	lineHeight: Spacing.Large,
};
