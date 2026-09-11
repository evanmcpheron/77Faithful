import { FeedbackColors, SurfaceColors, TextColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import styled from 'styled-components/native';
import { scriptureTitleStyle } from './scripture.styles';

export const GratitudeSections = styled.View({ gap: Spacing.Large });
export const GratitudeHeading = styled.View({ gap: Spacing.XSmall });
export const GratitudeExamples = styled.View({ gap: Spacing.Medium });
export const GratitudeRow = styled.View({
	flexDirection: 'row',
	alignItems: 'center',
	gap: Spacing.Medium,
});
export const GratitudeCopy = styled.View({ flex: 1 });
export const GratitudeAction = styled.View({ paddingTop: Spacing.XSmall });
export const GratitudeIconCircle = styled.View({
	width: Spacing.XXLarge,
	height: Spacing.XXLarge,
	borderRadius: Radius.Full,
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
});
export const gratitudeIconStyles = [
	{ backgroundColor: SurfaceColors.Accent },
	{ backgroundColor: FeedbackColors.WarningMuted },
	{ backgroundColor: FeedbackColors.InfoMuted },
];
export const gratitudeIconColors = [
	TextColors.Brand,
	TextColors.Warning,
	TextColors.Info,
] as const;
export const gratitudeTitleStyle = {
	...scriptureTitleStyle,
	fontSize: 34,
	lineHeight: 42,
};
export const gratitudeSectionStyle = {
	...scriptureTitleStyle,
	fontSize: 24,
	lineHeight: 30,
};
export const gratitudeBodyStyle = { fontSize: 18, lineHeight: 26 };
