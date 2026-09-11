import { useMemo, useState } from 'react';
import { Platform } from 'react-native';

import {
	isGlassEffectAPIAvailable,
	isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import {
	interpolate,
	useAnimatedReaction,
	useAnimatedStyle,
} from 'react-native-reanimated';

import { Input } from '@td/components/form/input/input.component';
import { Avatar } from '@td/components/ui/avatar/avatar.component';
import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { IconButtonVariant } from '@td/components/ui/icon-button/icon-button.types';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { ProgressBar } from '@td/components/ui/progress-bar/progress-bar.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { NeutralColors } from '@td/theme/colors';
import { IconSizes, IconStrokeWidths } from '@td/theme/icon-sizes';
import {
	TypographySize,
	TypographyTone,
	TypographyWeight,
} from '@td/theme/typography';
import { ComponentTone } from '@td/types/ui.types';

import { scheduleOnRN } from 'react-native-worklets';
import {
	StyledHeaderBrandRow,
	StyledHeaderChrome,
	StyledHeaderFallbackBlur,
	StyledHeaderFallbackOverlay,
	StyledHeaderGlassBackground,
	StyledHeaderProgress,
	StyledHeaderShadow,
	StyledHeaderTopRow,
	StyledHeaderTopRowContent,
	StyledSearchInputSlot,
} from './header-top-row.styles';
import type { IHeaderTopRowProps } from './header-top-row.types';

const SCROLL_THRESHOLD = 5;
const GLASS_ANIMATION_DURATION_SECONDS = 0.22;

interface IHeaderActionButtonProps {
	notifications: unknown[];
	showNotifications: boolean;
	onAddPress?: () => void;
	onEditPress?: () => void;
}

const HeaderActionButton = ({
	notifications,
	showNotifications,
	onAddPress,
	onEditPress,
}: IHeaderActionButtonProps) => {
	if (onAddPress) {
		return (
			<IconButton
				hasBackground
				name={IconName.Plus}
				onPress={onAddPress}
				accessibilityLabel={'Add Button'}
				tone={ComponentTone.Brand}
				variant={IconButtonVariant.Solid}
				iconSize={IconSizes.Medium}
				strokeWidth={IconStrokeWidths.Thick}
			/>
		);
	}

	if (onEditPress) {
		return (
			<IconButton
				hasBackground
				name={IconName.Edit}
				onPress={onEditPress}
				accessibilityLabel={'Edit Button'}
				tone={ComponentTone.Brand}
				variant={IconButtonVariant.Solid}
				iconSize={IconSizes.Medium}
				strokeWidth={IconStrokeWidths.Thick}
			/>
		);
	}

	if (!showNotifications) return null;

	return (
		<IconButton
			name={
				notifications.length > 0
					? IconName.BellNotification
					: IconName.Bell
			}
			hasBackground
			variant={IconButtonVariant.Soft}
			iconSize={IconSizes.Large}
			accessibilityLabel='Notifications'
			tone={ComponentTone.Neutral}
			onPress={(): void => {
				console.log('Notification Pressed');
			}}
		/>
	);
};

export const HeaderTopRow = ({
	canGoBack = false,
	onBackPress,
	showNotifications = true,
	title,
	progress,
	titleIcon,
	hasLogo = false,
	searchInput,
	scrollOffset,
	onAddPress,
	onEditPress,
}: IHeaderTopRowProps) => {
	const router = useRouter();

	const canUseLiquidGlass = useMemo(() => {
		return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
	}, []);

	const [notifications, setNotifications] = useState([]);
	const [isGlassVisible, setIsGlassVisible] = useState(() => {
		return (scrollOffset?.value ?? 0) > SCROLL_THRESHOLD;
	});

	useAnimatedReaction(
		() => (scrollOffset?.value ?? 0) > SCROLL_THRESHOLD,
		(shouldShowGlass, previousShouldShowGlass) => {
			if (shouldShowGlass !== previousShouldShowGlass) {
				scheduleOnRN(setIsGlassVisible, shouldShowGlass);
			}
		},
		[scrollOffset],
	);

	const fallbackAnimatedStyle = useAnimatedStyle(() => {
		const offset = scrollOffset?.value ?? 0;

		return {
			opacity: interpolate(
				offset,
				[0, SCROLL_THRESHOLD],
				[0, 1],
				'clamp',
			),
		};
	});

	const glassEffectStyle = {
		animate: true,
		animationDuration: GLASS_ANIMATION_DURATION_SECONDS,
		style: isGlassVisible ? 'clear' : 'none',
	} as const;
	const shouldRenderFallbackBlur = Platform.OS === 'ios';

	return (
		<StyledHeaderTopRow>
			<StyledHeaderShadow>
				<StyledHeaderChrome>
					{canUseLiquidGlass ? (
						<StyledHeaderGlassBackground
							colorScheme='light'
							glassEffectStyle={glassEffectStyle}
							isInteractive
							style={{
								backgroundColor: isGlassVisible
									? NeutralColors.Grey200
									: 'transparent',
							}}
						/>
					) : (
						<>
							{shouldRenderFallbackBlur ? (
								<StyledHeaderFallbackBlur
									intensity={18}
									tint='light'
									style={{ opacity: isGlassVisible ? 1 : 0 }}
								/>
							) : null}
							<StyledHeaderFallbackOverlay
								style={[
									fallbackAnimatedStyle,
									{
										backgroundColor: isGlassVisible
											? NeutralColors.Grey200
											: 'transparent',
									},
								]}
							/>
						</>
					)}

					<StyledHeaderTopRowContent>
						{canGoBack ? (
							<IconButton
								name={IconName.ArrowLeft}
								variant={IconButtonVariant.Soft}
								hasBackground
								strokeWidth={IconStrokeWidths.Regular}
								accessibilityLabel='back button'
								onPress={(): void => {
									if (onBackPress) onBackPress();
									else router.back();
								}}
							/>
						) : (
							<Avatar />
						)}

						{hasLogo ? (
							<AppIcon
								name={IconName.DarkLogo}
								size={IconSizes.XXLarge}
							/>
						) : (
							(title || titleIcon) && (
								<StyledHeaderBrandRow>
									{titleIcon && (
										<AppIcon
											tone={ComponentTone.Brand}
											name={titleIcon}
										/>
									)}

									{progress && (
										<StyledHeaderProgress>
											<ProgressBar {...progress} />
										</StyledHeaderProgress>
									)}
									{title && (
										<Typography
											size={TypographySize.H1}
											tone={TypographyTone.Primary}
											weight={TypographyWeight.Bold}
										>
											{title}
										</Typography>
									)}
								</StyledHeaderBrandRow>
							)
						)}

						<HeaderActionButton
							notifications={notifications}
							showNotifications={showNotifications}
							onAddPress={onAddPress}
							onEditPress={onEditPress}
						/>
					</StyledHeaderTopRowContent>
				</StyledHeaderChrome>
			</StyledHeaderShadow>

			{searchInput ? (
				<StyledSearchInputSlot>
					<Input {...searchInput} />
				</StyledSearchInputSlot>
			) : null}
		</StyledHeaderTopRow>
	);
};
