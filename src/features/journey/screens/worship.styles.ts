import { FeedbackColors, NeutralColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import styled from 'styled-components/native';
import { scriptureHeroStyle, scriptureTitleStyle } from './scripture.styles';

export const WorshipSections = styled.View({ gap: Spacing.Small });
export const WorshipHeading = styled.View({ gap: Spacing.XSmall });
export const WorshipIntroduction = styled.View({
	gap: Spacing.XSmall,
	paddingBottom: Spacing.XSmall,
});
export const WorshipAction = styled.View({
	paddingBottom: Spacing.XSmall,
});
export const WorshipExamples = styled.View({
	gap: Spacing.Small,
});
export const WorshipRows = styled.View({ gap: Spacing.Medium });
export const WorshipRow = styled.View({
	flexDirection: 'row',
	alignItems: 'center',
	gap: Spacing.Small,
});
export const WorshipCopy = styled.View({ flex: 1 });
export const WorshipIconCircle = styled.View({
	width: Spacing.XXLarge,
	height: Spacing.XXLarge,
	borderRadius: Radius.Full,
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
});
export const worshipIconStyles = [
	{ backgroundColor: SurfaceColors.Accent },
	{ backgroundColor: FeedbackColors.WarningMuted },
	{ backgroundColor: FeedbackColors.InfoMuted },
];
export const worshipTitleStyle = scriptureHeroStyle;
export const worshipSectionStyle = {
	...scriptureTitleStyle,
	fontSize: 24,
	lineHeight: 30,
};
export const worshipBodyStyle = {
	color: NeutralColors.Black,
	fontSize: 18,
	lineHeight: 24,
};
export const worshipExampleStyle = {
	color: NeutralColors.Black,
	fontSize: 16,
	lineHeight: 24,
};
