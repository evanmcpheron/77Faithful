import { StyledSurface } from './surface.styles';
import type { ISurfaceProps } from './surface.types';

export const Surface = ({
	children,
	padding = 'Small',
	testID,
	variant = 'Default',
}: ISurfaceProps) => {
	return (
		<StyledSurface
			padding={padding}
			testID={testID}
			variant={variant}
		>
			{children}
		</StyledSurface>
	);
};
