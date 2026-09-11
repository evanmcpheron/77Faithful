import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import styled from 'styled-components/native';
import { scriptureTitleStyle } from './scripture.styles';

export const movementColumnStyle = { gap: Spacing.Small };
export const movementHeadingStyle = {
	alignItems: 'stretch' as const,
	gap: Spacing.XXSmall,
};
export const movementTitleStyle = {
	...scriptureTitleStyle,
	fontSize: 34,
	lineHeight: 40,
};
export const movementPurposeStyle = { fontSize: 18, lineHeight: 26 };
export const movementSectionTitleStyle = {
	...scriptureTitleStyle,
	fontSize: 20,
	lineHeight: 26,
};
export const movementBodyStyle = { fontSize: 16, lineHeight: 22 };
export const MovementRow = styled.View({
	flexDirection: 'row',
	alignItems: 'center',
	gap: Spacing.Small,
});
export const MovementIntroduction = styled.View({
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: Spacing.Small,
	paddingVertical: Spacing.XSmall,
});
export const MovementCopy = styled.View({ flex: 1, gap: Spacing.XXSmall });
export const MovementIllustrationCircle = styled.View({
	width: Spacing.XXLarge,
	height: Spacing.XXLarge,
	borderRadius: Radius.Full,
	backgroundColor: SurfaceColors.Accent,
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
});
export const MovementExamplesSection = styled.View({ gap: Spacing.Small });
