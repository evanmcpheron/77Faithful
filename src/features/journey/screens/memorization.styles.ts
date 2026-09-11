import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import styled from 'styled-components/native';
import { scriptureTitleStyle } from './scripture.styles';

export const MemorizationSections = styled.View({ gap: Spacing.Small });
export const MemorizationHeading = styled.View({
	gap: Spacing.XSmall,
	paddingBottom: Spacing.XSmall,
});
export const MemorizationRow = styled.View({
	flexDirection: 'row',
	alignItems: 'center',
	gap: Spacing.Small,
});
export const MemorizationCopy = styled.View({ flex: 1 });
export const MemorizationIconCircle = styled.View({
	width: Spacing.XXLarge,
	height: Spacing.XXLarge,
	borderRadius: Radius.Full,
	backgroundColor: SurfaceColors.Accent,
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
});
export const MemorizationAction = styled.View({
	paddingTop: Spacing.XLarge,
});
export const memorizationTitleStyle = {
	...scriptureTitleStyle,
	fontSize: 30,
	lineHeight: 38,
};
export const memorizationSectionStyle = {
	...scriptureTitleStyle,
	fontSize: 24,
	lineHeight: 30,
};
export const memorizationBodyStyle = {
	...scriptureTitleStyle,
	fontSize: 18,
	lineHeight: 26,
};
