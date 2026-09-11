import { TextColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from 'react-native';
import styled from 'styled-components/native';

const editorialFont = Platform.select({
	ios: 'Georgia',
	android: 'serif',
	default: 'Georgia',
});
export const StyledThemesContent = styled.View({
	width: '100%',
	maxWidth: 640,
	alignSelf: 'center',
});
export const StyledThemesHero = styled.View({
	minHeight: 380,
	justifyContent: 'flex-end',
	overflow: 'hidden',
});
export const StyledHeroImage = styled(Image)({
	position: 'absolute',
	top: 0,
	bottom: 0,
	left: 0,
	right: 0,
});
export const StyledHeroGradient = styled(LinearGradient)({
	position: 'absolute',
	top: 0,
	bottom: 0,
	left: 0,
	right: 0,
});
export const StyledHeroCopy = styled.View({
	padding: Spacing.Medium,
	paddingTop: Spacing.XXHuge,
	gap: Spacing.XSmall,
});
export const StyledThemeList = styled.View({
	paddingHorizontal: Spacing.XSmall,
	paddingVertical: Spacing.Small,
	gap: Spacing.XSmall,
});
export const StyledThemeRow = styled.View({
	flexDirection: 'row',
	alignItems: 'center',
	gap: Spacing.Medium,
	paddingVertical: Spacing.XSmall,
	paddingHorizontal: Spacing.Small,
	minHeight: 60,
});
export const StyledWeekBadge = styled.View({
	minWidth: 44,
	minHeight: 44,
	borderRadius: Radius.Full,
	alignItems: 'center',
	justifyContent: 'center',
	padding: Spacing.XXSmall,
});
export const StyledThemeCopy = styled.View({ flex: 1 });
export const textStyles = {
	heroTitle: {
		fontFamily: editorialFont,
		fontSize: 32,
		lineHeight: 36,
		fontStyle: 'italic',
		fontWeight: '400',
		color: TextColors.Inverse,
	},
	heroDescription: {
		fontSize: 16,
		lineHeight: 22,
		color: TextColors.Inverse,
	},
	themeTitle: {
		fontFamily: editorialFont,
		fontSize: 18,
		lineHeight: 24,
		fontWeight: '400',
	},
	themeDescription: { fontSize: 14, lineHeight: 20 },
	weekNumber: {
		fontFamily: editorialFont,
		fontSize: 24,
		lineHeight: 30,
		fontWeight: '400',
		color: TextColors.Inverse,
	},
} as const;
