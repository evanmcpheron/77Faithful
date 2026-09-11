import { TurndownStaticScreen } from '@td/components/layout/screen/screen.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { StyledCenteredScreenContent } from '@td/features/shared/styles/boilerplate.styles';
import { SurfaceColors } from '@td/theme/colors';

export const CreateCommunityScreen = () => {
	return (
		<TurndownStaticScreen backgroundColor={SurfaceColors.Screen}>
			<StyledCenteredScreenContent>
				<Typography
					size='H1'
					align='center'
				>
					Create Community
				</Typography>
			</StyledCenteredScreenContent>
		</TurndownStaticScreen>
	);
};
