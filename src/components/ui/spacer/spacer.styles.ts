import { View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';

import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { TSpacing } from '@td/theme/spacing';

interface ISpacerStyleProps {
	size: TSpacing;
}

const FilteredView = withFilteredProps<ViewProps, ISpacerStyleProps>(View, [
	'size',
]);

export const StyledSpacer = styled(FilteredView)<ISpacerStyleProps>(
	({ size }) => ({
		height: size,
	}),
);
