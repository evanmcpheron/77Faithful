import {
	Pressable,
	TextInput,
	View,
	type TextInputProps,
	type ViewProps,
} from 'react-native';
import styled from 'styled-components/native';

import { BorderColors, NeutralColors, TextColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Shadows } from '@td/theme/shadows';
import { Spacing } from '@td/theme/spacing';
import { TypographyStyles } from '@td/theme/typography';
import { withFilteredProps } from '@td/utils/styles/styles.util';

const INPUT_BORDER_WIDTH = 1;
const INPUT_ACTIVE_BORDER_WIDTH = 2;
const INPUT_MIN_HEIGHT = 50;
const INPUT_HORIZONTAL_PADDING = 16;
const INPUT_ACTIVE_HORIZONTAL_PADDING =
	INPUT_HORIZONTAL_PADDING - (INPUT_ACTIVE_BORDER_WIDTH - INPUT_BORDER_WIDTH);
const INPUT_MULTILINE_MIN_HEIGHT = 96;

interface IInputContainerStyleProps {
	hasError: boolean;
	isFocused: boolean;
	rounded: boolean;
}

interface IInputStyleProps {
	isFocused: boolean;
}

const FilteredView = withFilteredProps<ViewProps, IInputContainerStyleProps>(
	View,
	['hasError', 'isFocused', 'rounded'],
);

const FilteredTextInput = withFilteredProps<TextInputProps, IInputStyleProps>(
	TextInput,
	['isFocused'],
);

export const StyledInputFieldContainer = styled.View({
	gap: Spacing.XSmall,
	flex: 1,
	minWidth: 0,
});

export const StyledInputContainer = styled(
	FilteredView,
)<IInputContainerStyleProps>(({ hasError, isFocused, rounded }) => ({
	...Shadows.Card,
	alignItems: 'center',
	alignSelf: 'stretch',
	backgroundColor: NeutralColors.White,
	borderColor: hasError
		? BorderColors.Error
		: isFocused
			? BorderColors.Focus
			: BorderColors.Default,
	borderRadius: rounded ? Radius.Full : Radius.Medium,
	borderWidth:
		isFocused || hasError ? INPUT_ACTIVE_BORDER_WIDTH : INPUT_BORDER_WIDTH,
	flexDirection: 'row',
	gap: Spacing.XSmall,
	minHeight: INPUT_MIN_HEIGHT,
	paddingHorizontal:
		isFocused || hasError
			? INPUT_ACTIVE_HORIZONTAL_PADDING
			: INPUT_HORIZONTAL_PADDING,
}));

export const StyledInput = styled(FilteredTextInput)<IInputStyleProps>(
	({ multiline }) => ({
		color: TextColors.Primary,
		flex: 1,
		fontSize: TypographyStyles.Body.Size,
		minHeight: multiline ? INPUT_MULTILINE_MIN_HEIGHT : Spacing.XLarge,
		paddingVertical: multiline ? Spacing.Small : 0,
		textAlignVertical: multiline ? 'top' : 'center',
	}),
);

export const StyledInputTrailingIconButton = styled(Pressable)({
	alignItems: 'center',
	justifyContent: 'center',
});

export const StyledErrorMessageContainer = styled(View)({});
