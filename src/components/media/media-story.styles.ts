import { View } from 'react-native';
import styled from 'styled-components/native';

import { Spacing } from '@td/theme/spacing';

export const StyledMediaStoryFrame = styled(View)({
	height: Spacing.XXHuge,
	width: '100%',
});

export const StyledMediaStoryStack = styled(View)({
	gap: Spacing.Small,
	width: '100%',
});
