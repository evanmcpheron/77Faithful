import { NeutralColors } from '@td/theme/colors';
import { withFilteredProps } from '@td/utils/styles/styles.util';
import { View, ViewProps } from 'react-native';
import styled from 'styled-components/native';
import { IDividerProps } from './divider.types';

const FilteredView = withFilteredProps<ViewProps, IDividerProps>(View, [
	'thickness',
]);

export const StyledDivider = styled(FilteredView)<IDividerProps>(({
	thickness,
}) => {
	return {
		height: thickness === 'Line' ? 1 : 0,
		backgroundColor: NeutralColors.Grey500,
		flex: 1,
	};
});
