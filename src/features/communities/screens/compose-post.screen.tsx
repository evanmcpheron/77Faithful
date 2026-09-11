import { TurndownStaticScreen } from '@td/components/layout/screen/screen.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { StyledCenteredScreenContent } from '@td/features/shared/styles/boilerplate.styles';
import { SurfaceColors } from '@td/theme/colors';

export const ComposePostScreen = () => {
	return (
		<TurndownStaticScreen backgroundColor={SurfaceColors.Screen}>
			<StyledCenteredScreenContent>
				<Typography
					size='H1'
					align='center'
				>
					Compose Post
				</Typography>
			</StyledCenteredScreenContent>
		</TurndownStaticScreen>
	);
};
