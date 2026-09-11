import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import styled from 'styled-components/native';
import { scriptureTitleStyle } from './scripture.styles';

export const HouseholdSections = styled.View({ gap: Spacing.XXLarge });
export const HouseholdIntroduction = styled.View({ gap: Spacing.Small });
export const HouseholdExamples = styled.View({ gap: Spacing.Small });
export const HouseholdRows = styled.View({ gap: Spacing.Medium });
export const HouseholdRow = styled.View({
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: Spacing.Small,
});
export const HouseholdNumber = styled.View({
	width: Spacing.Large + Spacing.Small,
	height: Spacing.Large + Spacing.Small,
	borderRadius: Radius.Full,
	backgroundColor: SurfaceColors.Accent,
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
});
export const HouseholdCopy = styled.View({ flex: 1 });
export const HouseholdAction = styled.View({ marginTop: 'auto' });
export const householdTitleStyle = {
	...scriptureTitleStyle,
	fontSize: 34,
	lineHeight: 40,
};
export const householdSectionStyle = {
	...scriptureTitleStyle,
	fontSize: 24,
	lineHeight: 30,
};
