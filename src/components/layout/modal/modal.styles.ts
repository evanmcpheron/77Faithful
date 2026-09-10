import { BlurView } from 'expo-blur';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';

import { BrandColors } from '@td/theme/colors';
import { Layout } from '@td/theme/layout';
import { Spacing } from '@td/theme/spacing';
import { ZIndex } from '@td/theme/z-index';
import { hexToRgbaString } from '@td/utils/styles/styles.util';

export const StyledModalRoot = styled.View({
	alignItems: 'center',
	bottom: 0,
	justifyContent: 'center',
	left: 0,
	paddingHorizontal: Layout.ScreenHorizontalPadding,
	paddingVertical: Spacing.Large,
	position: 'absolute',
	right: 0,
	top: 0,
	zIndex: ZIndex.Modal,
});

export const StyledModalBackdrop = styled(Pressable)({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const StyledModalBlur = styled(BlurView)({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const StyledModalTintOverlay = styled.View({
	backgroundColor: hexToRgbaString(BrandColors.Secondary, 0.3),
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const StyledModalContent = styled.View({
	maxWidth: 520,
	width: '100%',
});
