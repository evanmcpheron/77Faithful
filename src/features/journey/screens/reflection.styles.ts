import { StyledInput } from '@td/components/form/input/input.styles';
import { BorderColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { View } from 'react-native';
import styled from 'styled-components/native';

export const ReflectionColumn = styled(View)({
	width: '100%',
	maxWidth: 640,
	alignSelf: 'center',
	gap: Spacing.Medium,
});
export const ReflectionIntro = styled(View)({
	alignItems: 'center',
	gap: Spacing.Small,
});
export const ReflectionRow = styled(View)({
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: Spacing.Small,
});
export const ReflectionText = styled(View)({ flex: 1, gap: Spacing.XSmall });
export const ReflectionIcon = styled(View)({
	width: Spacing.XXLarge,
	height: Spacing.XXLarge,
	borderRadius: Radius.Full,
	backgroundColor: SurfaceColors.Accent,
	justifyContent: 'center',
	alignItems: 'center',
});
export const ReflectionInput = styled(StyledInput)({
	flex: 0,
	minHeight: Spacing.Huge * 2,
	padding: Spacing.Small,
	borderWidth: 1,
	borderColor: BorderColors.Control,
	borderRadius: Radius.Medium,
	backgroundColor: SurfaceColors.Card,
	fontSize: 18,
	lineHeight: 28,
});
export const ReflectionActions = styled(View)({
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: Spacing.Small,
});
export const ReflectionAction = styled(View)({ flexGrow: 1, flexBasis: 160 });

export const ReflectionField = styled(View)({ gap: Spacing.XSmall });
export const ReflectionPrivacy = styled(View)({
	flexDirection: 'row',
	justifyContent: 'flex-end',
	alignItems: 'center',
	gap: Spacing.XXSmall,
});
export const ReflectionPrivacyText = styled(View)({ flexShrink: 1 });
