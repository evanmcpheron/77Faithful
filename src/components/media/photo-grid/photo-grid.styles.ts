import { View } from 'react-native';
import styled from 'styled-components/native';

import { Spacing } from '@td/theme/spacing';

export const StyledPhotoGrid = styled(View)({
	alignItems: 'flex-start',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: Spacing.XSmall,
});
