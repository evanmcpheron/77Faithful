import { AppIcon } from '@td/components/ui/icon/icon.component';
import { IconSizes, IconStrokeWidths } from '@td/theme/icon-sizes';
import { ComponentTone, type TComponentTone } from '@td/types/ui.types';

import { StyledIconButton } from './icon-button.styles';
import { IconButtonVariant, type IIconButtonProps } from './icon-button.types';

const getIconTone = ({
	tone,
	variant,
	hasBackground,
}: Required<
	Pick<IIconButtonProps, 'tone' | 'variant' | 'hasBackground'>
>): TComponentTone => {
	if (hasBackground && (variant === 'Solid' || variant === 'Ghost')) {
		return 'Inverse';
	}

	return tone;
};

export const IconButton = ({
	accessibilityLabel,
	disabled = false,
	iconSize = IconSizes.Large,
	name,
	hasBackground = false,
	size = 'Medium',
	testID,
	tone = ComponentTone.Neutral,
	variant = IconButtonVariant.Soft,
	strokeWidth = IconStrokeWidths.Regular,
	onPress,
}: IIconButtonProps) => {
	const iconTone = getIconTone({ tone, variant, hasBackground });

	return (
		<StyledIconButton
			accessibilityLabel={accessibilityLabel}
			accessibilityRole='button'
			accessibilityState={{ disabled }}
			disabled={disabled}
			hasBackground={hasBackground}
			size={size}
			testID={testID}
			tone={tone}
			variant={variant}
			onPress={onPress}
		>
			<AppIcon
				name={name}
				strokeWidth={strokeWidth}
				size={iconSize}
				tone={iconTone}
			/>
		</StyledIconButton>
	);
};
