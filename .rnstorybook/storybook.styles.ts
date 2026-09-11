import styled from 'styled-components/native';

import { NeutralColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';

export const StyledStorybookCanvas = styled.ScrollView.attrs({
	contentContainerStyle: {
		padding: Spacing.Small,
	},
})({
	backgroundColor: NeutralColors.Grey100,
	flex: 1,
});
