import { KeyboardAvoidingView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

import { BorderColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Shadows } from '@td/theme/shadows';
import { Spacing } from '@td/theme/spacing';

export const StyledScreenRoot = styled(View)({
	flex: 1,
});

export const StyledScreenSafeArea = styled(SafeAreaView)({
	flex: 1,
});

export const StyledScreenKeyboardAvoidingView = styled(KeyboardAvoidingView)({
	flex: 1,
});

export const StyledScreenContent = styled(View)({
	flex: 1,
	minHeight: 0,
});

export const StyledScreenStateContainer = styled(View)({
	flex: 1,
	justifyContent: 'center',
});

export const StyledScreenStateCard = styled(View)({
	...Shadows.Subtle,
	backgroundColor: 'transparent',
	borderColor: BorderColors.Subtle,
	borderRadius: Radius.Large,
	borderWidth: 1,
	gap: Spacing.Small,
	padding: Spacing.Medium,
});

export const screenShellFillStyle = {
	flex: 1,
} satisfies ViewStyle;

export const screenShellScrollContentStyle = {
	flexGrow: 1,
} satisfies ViewStyle;
