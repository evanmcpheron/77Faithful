import { ActivityIndicator } from 'react-native';

import { AppIcon } from '@td/components/ui/icon/icon.component';
import { IconSizes } from '@td/theme/icon-sizes';
import {
	TypographySize,
	TypographyTone,
	TypographyWeight,
} from '@td/theme/typography';

import { Typography } from '../typography/typography.component';
import type { ITypographyProps } from '../typography/typography.types';

import { ComponentTone, TComponentTone } from '@td/types/ui.types';
import { StyledButton, StyledButtonLinkContainer } from './button.styles';
import { ButtonSize, ButtonVariant, type IButtonProps } from './button.types';

const getButtonTypographyTone = ({
	tone,
	variant,
}: Required<Pick<IButtonProps, 'tone' | 'variant'>>): NonNullable<
	ITypographyProps['tone']
> => {
	if (variant === ButtonVariant.Link) {
		return tone === ComponentTone.Inverse
			? TypographyTone.Inverse
			: TypographyTone.Error;
	}

	if (variant === ButtonVariant.Solid) {
		return tone === ComponentTone.Warning ||
			tone === ComponentTone.Neutral ||
			tone === ComponentTone.Brand
			? TypographyTone.Primary
			: TypographyTone.Inverse;
	}
	if (tone === ComponentTone.Inverse) {
		return TypographyTone.Inverse;
	}

	if (tone === ComponentTone.Neutral) {
		return TypographyTone.Primary;
	}

	return tone;
};

export const TurndownButton = ({
	accessibilityLabel,
	align,
	children,
	disabled = false,
	fullWidth = true,
	leadingIconName,
	loading = false,
	size = ButtonSize.Medium,
	testID,
	tone = ComponentTone.Brand,
	trailingIconName,
	variant = ButtonVariant.Solid,
	onPress,
}: IButtonProps) => {
	const typographyTone = getButtonTypographyTone({ tone, variant });
	const isDisabled = disabled || loading;
	const iconTone =
		typographyTone === ComponentTone.Brand
			? tone
			: (typographyTone as TComponentTone);

	const content = (
		<>
			{loading ? <ActivityIndicator size='small' /> : null}

			{!loading && leadingIconName ? (
				<AppIcon
					name={leadingIconName}
					size={IconSizes.Small}
					tone={iconTone}
				/>
			) : null}

			<Typography
				align={align}
				weight={TypographyWeight.Semibold}
				size={
					variant === ButtonVariant.Link
						? TypographySize.H3
						: TypographySize.H1
				}
				tone={typographyTone}
				underline={variant === ButtonVariant.Link}
			>
				{children}
			</Typography>

			{!loading && trailingIconName ? (
				<AppIcon
					name={trailingIconName}
					size={IconSizes.Small}
					tone={iconTone}
				/>
			) : null}
		</>
	);

	if (variant === ButtonVariant.Link) {
		return (
			<StyledButtonLinkContainer
				align={align}
				fullWidth={fullWidth}
			>
				<StyledButton
					accessibilityLabel={accessibilityLabel}
					disabled={isDisabled}
					fullWidth={false}
					size={size}
					testID={testID}
					tone={tone}
					variant={variant}
					onPress={onPress}
				>
					{content}
				</StyledButton>
			</StyledButtonLinkContainer>
		);
	}

	return (
		<StyledButton
			accessibilityLabel={accessibilityLabel}
			disabled={isDisabled}
			fullWidth={fullWidth}
			size={size}
			testID={testID}
			tone={tone}
			variant={variant}
			onPress={onPress}
		>
			{content}
		</StyledButton>
	);
};
