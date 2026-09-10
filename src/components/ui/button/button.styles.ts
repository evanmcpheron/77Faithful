import {
	Pressable,
	View,
	type PressableProps,
	type ViewProps,
} from 'react-native';
import styled from 'styled-components/native';

import {
	ActionColors,
	BorderColors,
	BrandColors,
	FeedbackColors,
	NeutralColors,
	SurfaceColors,
} from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { IButtonProps, TButtonSize } from './button.types';

type TStyledButtonProps = Required<
	Pick<IButtonProps, 'disabled' | 'fullWidth' | 'size' | 'tone' | 'variant'>
>;

type TStyledButtonLinkContainerProps = Pick<
	IButtonProps,
	'align' | 'fullWidth'
>;

type TButtonSizeStyle = {
	minHeight: number;
	paddingHorizontal: number;
	paddingVertical: number;
};

const ButtonSizeStyles = {
	XSmall: {
		minHeight: 34,
		paddingHorizontal: Spacing.XSmall,
		paddingVertical: Spacing.XXSmall,
	},
	Small: {
		minHeight: 44,
		paddingHorizontal: Spacing.Small,
		paddingVertical: Spacing.XSmall,
	},
	Medium: {
		minHeight: 54,
		paddingHorizontal: Spacing.Medium,
		paddingVertical: Spacing.XSmall,
	},
	Large: {
		minHeight: 60,
		paddingHorizontal: Spacing.Large,
		paddingVertical: Spacing.Small,
	},
} satisfies Record<TButtonSize, TButtonSizeStyle>;

const getButtonBackgroundColor = ({
	tone,
	variant,
}: Pick<TStyledButtonProps, 'tone' | 'variant'>): string => {
	if (variant === 'Link' || variant === 'Ghost' || variant === 'Outline') {
		return 'transparent';
	}

	if (variant === 'Inverse') {
		return SurfaceColors.Screen;
	}

	if (tone === 'Inverse') {
		return SurfaceColors.Inverse;
	}

	if (tone === 'Neutral') {
		return NeutralColors.Grey100;
	}

	if (tone === 'Error') {
		return FeedbackColors.Error;
	}

	if (tone === 'Success') {
		return FeedbackColors.Success;
	}

	if (tone === 'Warning') {
		return FeedbackColors.Warning;
	}

	if (tone === 'Info') {
		return FeedbackColors.Info;
	}

	return ActionColors.PrimaryBackground;
};

const getButtonBorderColor = ({
	tone,
	variant,
}: Pick<TStyledButtonProps, 'tone' | 'variant'>): string => {
	if (variant !== 'Outline' && variant !== 'Inverse') {
		return 'transparent';
	}

	if (tone === 'Inverse') {
		return BorderColors.Inverse;
	}

	if (tone === 'Neutral') {
		return BorderColors.Muted;
	}

	if (tone === 'Error') {
		return FeedbackColors.Error;
	}

	if (tone === 'Success') {
		return FeedbackColors.Success;
	}

	if (tone === 'Warning') {
		return FeedbackColors.Warning;
	}

	if (tone === 'Info') {
		return FeedbackColors.Info;
	}

	return BrandColors.Primary;
};

const FilteredPressable = withFilteredProps<PressableProps, TStyledButtonProps>(
	Pressable,
	['variant', 'tone', 'size', 'fullWidth'],
);

const FilteredView = withFilteredProps<
	ViewProps,
	TStyledButtonLinkContainerProps
>(View, ['align', 'fullWidth']);

export const StyledButtonLinkContainer = styled(
	FilteredView,
)<TStyledButtonLinkContainerProps>(({ align, fullWidth }) => {
	const getAlignItems = () => {
		switch (align) {
			case 'right':
				return 'flex-end';
			case 'center':
				return 'center';
			default:
				return 'flex-start';
		}
	};

	return {
		alignItems: getAlignItems(),
		alignSelf: fullWidth ? 'stretch' : 'flex-start',
	};
});

export const StyledButton = styled(FilteredPressable)<TStyledButtonProps>(({
	disabled,
	fullWidth,
	size,
	tone,
	variant,
}) => {
	const isLink = variant === 'Link';
	const sizeStyle = ButtonSizeStyles[size];

	return {
		alignItems: isLink ? 'flex-start' : 'center',
		alignSelf: fullWidth ? 'stretch' : 'flex-start',
		backgroundColor: getButtonBackgroundColor({ tone, variant }),
		borderColor: getButtonBorderColor({ tone, variant }),
		borderRadius: isLink ? undefined : Radius.Full,
		borderWidth: variant === 'Inverse' || variant === 'Outline' ? 2 : 0,
		flexDirection: 'row',
		gap: isLink ? 0 : Spacing.XSmall,
		justifyContent: 'center',
		minHeight: isLink ? undefined : sizeStyle.minHeight,
		opacity: disabled ? ActionColors.DisabledOpacity : 1,
		paddingHorizontal: isLink ? 0 : sizeStyle.paddingHorizontal,
		paddingVertical: isLink ? 0 : sizeStyle.paddingVertical,
	};
});
