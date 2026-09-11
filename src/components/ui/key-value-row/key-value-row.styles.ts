import styled from 'styled-components/native';

import { Spacing } from '@td/theme/spacing';

export const StyledKeyValueRow = styled.View({
	alignItems: 'flex-start',
	flexDirection: 'row',
	gap: Spacing.XSmall,
	justifyContent: 'space-between',
});

export const StyledKeyValueRowContent = styled.View({
	flex: 1,
	gap: 2,
});
