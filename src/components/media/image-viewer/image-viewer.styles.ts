import { View } from 'react-native';
import styled from 'styled-components/native';

import { BorderColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';

export const StyledImageViewer = styled(View)({
	gap: Spacing.XSmall,
});

export const StyledImageViewerImage = styled(View)({
	backgroundColor: SurfaceColors.Muted,
	borderColor: BorderColors.Subtle,
	borderRadius: Radius.Medium,
	borderWidth: 1,
	height: Spacing.XXHuge,
	overflow: 'hidden',
	width: '100%',
});
