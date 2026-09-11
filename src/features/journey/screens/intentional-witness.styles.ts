import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import styled from 'styled-components/native';
import { scriptureTitleStyle } from './scripture.styles';

export const WitnessSections = styled.View({ gap: Spacing.Large });
export const WitnessHeading = styled.View({ gap: Spacing.XSmall });
export const WitnessInvitation = styled.View({ gap: Spacing.Small });
export const WitnessExamples = styled.View({ gap: Spacing.Large });
export const WitnessRow = styled.View({
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: Spacing.Medium,
});
export const WitnessCopy = styled.View({ flex: 1 });
export const WitnessDecoration = styled.View({ flexShrink: 0 });
export const WitnessBullet = styled.View({
	width: Spacing.Small + Spacing.XXSmall,
	height: Spacing.Small + Spacing.XXSmall,
	marginTop: Spacing.XXSmall,
	borderRadius: Radius.Full,
	backgroundColor: SurfaceColors.Accent,
	flexShrink: 0,
});
export const WitnessAction = styled.View({ paddingTop: Spacing.XLarge });
export const witnessTitleStyle = {
	...scriptureTitleStyle,
	fontSize: 34,
	lineHeight: 42,
};
export const witnessIntroductionStyle = {
	...scriptureTitleStyle,
	fontSize: 20,
	lineHeight: 26,
};
export const witnessBodyStyle = {
	...scriptureTitleStyle,
	fontSize: 18,
	lineHeight: 24,
};
export const witnessSectionStyle = {
	...scriptureTitleStyle,
	fontSize: 24,
	lineHeight: 30,
};
export const witnessNoticeStyle = {
	...scriptureTitleStyle,
	fontSize: 14,
	lineHeight: 21,
};
