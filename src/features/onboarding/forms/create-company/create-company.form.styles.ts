import styled from 'styled-components/native';

import { Spacing } from '@td/theme/spacing';

export const StyledCreateCompanyForm = styled.View({
	gap: Spacing.Small,
});

export const StyledCreateCompanyFormRow = styled.View({
	alignItems: 'flex-start',
	flexDirection: 'row',
	gap: Spacing.Small,
});

export const StyledCreateCompanyFormRowItem = styled.View({
	flex: 1,
	minWidth: 0,
});
