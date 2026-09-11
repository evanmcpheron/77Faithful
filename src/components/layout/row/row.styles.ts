import { View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';

import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

import type { IRowProps } from './row.types';

type TStyledRowProps = Pick<IRowProps, 'gap' | 'justifyContent'>;

const FilteredView = withFilteredProps<ViewProps, TStyledRowProps>(View, [
	'gap',
	'justifyContent',
]);

export const StyledRow = styled(FilteredView)<TStyledRowProps>(
	({ gap = Spacing.XSmall, justifyContent }) => ({
		alignItems: 'flex-start',
		flexDirection: 'row',
		gap,
		width: '100%',
		justifyContent: justifyContent || 'flex-start',
	}),
);

export const StyledRowItem = styled(View)({
	flexGrow: 1,
	flexShrink: 1,
	flexBasis: 0,
	minWidth: 0,
});
