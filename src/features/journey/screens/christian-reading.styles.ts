import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import styled from 'styled-components/native';
import { scriptureTitleStyle } from './scripture.styles';

export const ChristianReadingSections = styled.View({ gap: Spacing.Small });
export const ChristianReadingHeading = styled.View({
	gap: Spacing.Small,
	paddingBottom: Spacing.XSmall,
});
export const ChristianReadingRow = styled.View({
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: Spacing.Small,
});
export const ChristianReadingCopy = styled.View({
	flex: 1,
	gap: Spacing.XSmall,
});
export const ChristianReadingIcon = styled.View({
	width: Spacing.XXLarge,
	height: Spacing.XXLarge,
	borderRadius: Radius.Full,
	backgroundColor: SurfaceColors.Accent,
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
});
export const ChristianReadingAction = styled.View({
	marginTop: 'auto',
	paddingTop: Spacing.XLarge,
});
export const christianReadingTitleStyle = {
	...scriptureTitleStyle,
	fontSize: 34,
	lineHeight: 40,
};
export const christianReadingSectionStyle = {
	...scriptureTitleStyle,
	fontSize: 20,
	lineHeight: 26,
};
