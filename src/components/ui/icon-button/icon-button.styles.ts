import { Pressable, type PressableProps } from 'react-native';
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
import type { TComponentTone } from '@td/types/ui.types';
import {
	hexToRgbaString,
	withFilteredProps,
} from '@td/utils/styles/styles.util';

import type {
	IIconButtonProps,
	TIconButtonSize,
	TIconButtonVariant,
} from './icon-button.types';

type TStyledIconButtonProps = Required<
	Pick<
		IIconButtonProps,
		'disabled' | 'size' | 'tone' | 'variant' | 'hasBackground'
	>
>;

const ICON_BUTTON_SIZE_CONFIG: Record<TIconButtonSize, number> = {
	Small: 32,
	Medium: 48,
	Large: 64,
};

const getSolidBackgroundColor = (tone: TComponentTone): string => {
	if (tone === 'Inverse') {
		return SurfaceColors.Inverse;
	}

	if (tone === 'Neutral') {
		return NeutralColors.Grey700;
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

	if (tone === 'Brand') {
		return BrandColors.Primary;
	}

	return BrandColors.Secondary;
};

const getIconButtonBackgroundColor = ({
	tone,
	variant,
}: {
	tone: TComponentTone;
	variant: TIconButtonVariant;
}): string => {
	if (variant === 'Ghost') {
		return 'rgba(255, 255, 255, 0.25)';
	}

	if (variant === 'Solid') {
		return getSolidBackgroundColor(tone);
	}

	if (tone === 'Neutral') {
		return NeutralColors.Grey100;
	}
	if (tone === 'Inverse') {
		return BrandColors.Primary;
	}

	return SurfaceColors.Muted;
};

const FilteredPressable = withFilteredProps<
	PressableProps,
	TStyledIconButtonProps
>(Pressable, ['size', 'tone', 'variant', 'hasBackground']);

export const StyledIconButton = styled(
	FilteredPressable,
)<TStyledIconButtonProps>(({
	disabled,
	size,
	tone,
	variant,
	hasBackground,
}) => {
	const buttonSize = ICON_BUTTON_SIZE_CONFIG[size];

	return {
		alignItems: 'center',
		backgroundColor: hasBackground
			? getIconButtonBackgroundColor({ tone, variant })
			: 'transparent',
		borderColor: hexToRgbaString(BorderColors.Inverse, 0.2),
		borderRadius: Radius.Full,
		borderWidth: hasBackground ? 1 : 0,
		height: buttonSize,
		justifyContent: 'center',
		opacity: disabled ? ActionColors.DisabledOpacity : 1,
		width: buttonSize,
	};
});
