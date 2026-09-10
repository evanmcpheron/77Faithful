import { View } from 'react-native';

import { NeutralColors, TextColors } from '@td/theme/colors';
import { IconSizes, IconStrokeWidths } from '@td/theme/icon-sizes';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { ComponentTone } from '@td/types/ui.types';

import type { IAppIconProps } from './icon.types';
import { getBrandIconColor, getIconComponent } from './icon.types';

const getIconToneColor = (tone: NonNullable<IAppIconProps['tone']>): string => {
	if (tone === 'Brand') {
		return TextColors.Brand;
	}

	if (tone === 'Inverse') {
		return TextColors.Inverse;
	}

	if (tone === 'Success') {
		return TextColors.Success;
	}

	if (tone === 'Warning') {
		return TextColors.Warning;
	}

	if (tone === 'Error') {
		return TextColors.Error;
	}

	if (tone === 'Info') {
		return TextColors.Info;
	}

	return TextColors.Secondary;
};

export const AppIcon = ({
	color,
	disabled = false,
	name,
	size = IconSizes.Large,
	strokeWidth = IconStrokeWidths.Regular,
	style,
	hasBackground = false,
	testID,
	tone = ComponentTone.Neutral,
	variant,
}: IAppIconProps) => {
	const SelectedIcon = getIconComponent(name, variant);
	const colorValue =
		color ?? getBrandIconColor(name) ?? getIconToneColor(tone);

	if (hasBackground) {
		return (
			<View
				style={{
					backgroundColor: NeutralColors.White,
					borderRadius: Radius.Full,
					padding: Spacing.XSmall,
				}}
			>
				<SelectedIcon
					color={colorValue}
					height={size}
					opacity={disabled ? 0.5 : 1}
					strokeWidth={strokeWidth}
					style={style}
					testID={testID}
					width={size}
				/>
			</View>
		);
	}

	return (
		<SelectedIcon
			color={colorValue}
			height={size}
			opacity={disabled ? 0.5 : 1}
			strokeWidth={strokeWidth}
			style={style}
			testID={testID}
			width={size}
		/>
	);
};
