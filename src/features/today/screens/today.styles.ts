import { View } from 'react-native';
import styled from 'styled-components/native';

import { StyledCard } from '@td/components/ui/card/card.styles';
import { CardVariant } from '@td/components/ui/card/card.types';
import { Spacing } from '@td/theme/spacing';
import { ComponentPadding, ComponentTone } from '@td/types/ui.types';

export const StyledTodaySummaryCards = styled(View)({
	width: '100%',
	flexDirection: 'row',
	alignItems: 'stretch',
	gap: Spacing.XSmall,
	paddingTop: Spacing.Small,
});

export const StyledTodaySummaryCard = styled(StyledCard).attrs({
	padding: ComponentPadding.Medium,
	tone: ComponentTone.Neutral,
	variant: CardVariant.Outlined,
})({
	flexGrow: 1,
	flexShrink: 1,
	flexBasis: 0,
	minWidth: 0,
});
