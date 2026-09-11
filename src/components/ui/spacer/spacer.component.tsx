import { Spacing } from '@td/theme/spacing';

import { StyledSpacer } from './spacer.styles';
import type { ISpacerProps } from './spacer.types';

export const Spacer = ({ size = Spacing.XSmall }: ISpacerProps) => {
	return <StyledSpacer size={size} />;
};
