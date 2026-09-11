import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';

export const StyledHeaderTopRow = styled(SafeAreaView).attrs({
	edges: ['top'] as const,
})({
	backgroundColor: 'transparent',
	gap: Spacing.Small,
	paddingBottom: Spacing.Small,
	paddingHorizontal: Spacing.Medium,
	zIndex: 3,
});

export const StyledHeaderChrome = styled.View({
	borderRadius: Radius.XLarge,
	overflow: 'hidden',
	position: 'relative',
});

export const StyledHeaderGlassBackground = styled(GlassView)({
	bottom: 0,
	left: 0,
	backgroundColor: 'transparent',
	position: 'absolute',
	right: 0,
	top: 0,
});

export const StyledHeaderFallbackBlur = styled(BlurView)({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const StyledHeaderFallbackOverlay = styled(Animated.View)({
	backgroundColor: 'transparent',
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const StyledHeaderTopRowContent = styled.View({
	alignItems: 'center',
	flexDirection: 'row',
	justifyContent: 'space-between',
	paddingHorizontal: Spacing.Small,
	paddingVertical: Spacing.XSmall,
	width: '100%',
});

export const StyledHeaderBrandRow = styled.View({
	alignItems: 'center',
	flexDirection: 'row',
	gap: Spacing.XSmall,
});

export const StyledSearchInputSlot = styled.View({
	alignSelf: 'stretch',
	flexDirection: 'row',
	width: '100%',
});
