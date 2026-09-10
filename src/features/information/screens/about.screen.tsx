import { TurndownStaticScreen } from '@td/components/layout/screen/screen.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { StyledCenteredScreenContent } from '@td/features/shared/styles/boilerplate.styles';
import { SurfaceColors } from '@td/theme/colors';

export const AboutScreen = () => {
	return (
		<TurndownStaticScreen backgroundColor={SurfaceColors.Screen}>
			<StyledCenteredScreenContent>
				<Typography
					size='H1'
					align='center'
				>
					About &amp; Help
				</Typography>
			</StyledCenteredScreenContent>
		</TurndownStaticScreen>
	);
};
