import { StyledDivider } from './divider.styles';
import { IDividerProps } from './divider.types';

export const Divider = ({ thickness = 'Line' }: IDividerProps) => (
	<StyledDivider thickness={thickness} />
);
