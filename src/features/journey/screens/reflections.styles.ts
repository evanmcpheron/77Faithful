import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { Image } from 'expo-image';
import { Platform } from 'react-native';
import styled from 'styled-components/native';

export const ReflectionContent = styled.View({
	width: '100%',
	maxWidth: 640,
	alignSelf: 'center',
	gap: Spacing.XLarge,
});
export const ReflectionHeader = styled.View({
	gap: Spacing.XSmall,
	paddingTop: Spacing.Small,
});
export const ReflectionHeadingRow = styled.View({
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: Spacing.Small,
});
export const ReflectionHero = styled.View({
	height: Spacing.XXHuge * 2,
	borderRadius: Radius.Medium,
	overflow: 'hidden',
});
export const ReflectionQuoteImage = styled(Image)({
	position: 'absolute',
	width: '88%',
	height: '140%',
	top: '-21%',
	left: '3%',
});
export const ReflectionHeroBranch = styled(Image)({
	position: 'absolute',
	width: '38%',
	height: '85%',
	right: '-4%',
	bottom: 0,
});
export const ReflectionActions = styled.View({
	flexDirection: 'row',
	gap: Spacing.XSmall,
	justifyContent: 'space-between',
	flexWrap: 'wrap',
});
export const ReflectionAction = styled.View({
	flex: 1,
	minWidth: 90,
	alignItems: 'center',
	gap: Spacing.XSmall,
	borderRadius: Radius.Medium,
	paddingVertical: Spacing.XSmall,
});
export const ReflectionCircle = styled.View({
	width: Spacing.XXXLarge,
	height: Spacing.XXXLarge,
	borderRadius: Radius.Full,
	alignItems: 'center',
	justifyContent: 'center',
});
export const ReflectionSection = styled.View({ gap: Spacing.Medium });
export const ReflectionDivider = styled.View({
	height: 1,
	marginHorizontal: Spacing.Small,
});
export const ReflectionFeatured = styled.Pressable({
	padding: Spacing.Medium,
	borderRadius: Radius.Medium,
	gap: Spacing.XSmall,
	minHeight: 120,
});
export const ReflectionEntryRow = styled.Pressable({
	flexDirection: 'row',
	gap: Spacing.Small,
	alignItems: 'center',
	minHeight: 56,
	paddingVertical: Spacing.XSmall,
	paddingHorizontal: Spacing.Small,
	borderBottomWidth: 1,
});
export const ReflectionEntryCopy = styled.View({
	flex: 1,
	gap: Spacing.XXSmall,
});
export const ReflectionFooter = styled.View({
	padding: Spacing.Medium,
	paddingRight: Spacing.XXLarge,
	borderRadius: Radius.Medium,
	overflow: 'hidden',
	gap: Spacing.Small,
});
export const ReflectionFooterBranch = styled(Image)({
	position: 'absolute',
	right: -Spacing.Small,
	top: 0,
	height: '115%',
	width: Spacing.XXHuge,
});
const serif = Platform.select({
	ios: 'Georgia',
	android: 'serif',
	default: 'Georgia',
});
export const reflectionTextStyles = {
	intro: { fontFamily: serif, fontSize: 18, lineHeight: 26 },
	heading: { fontFamily: serif, fontSize: 24, lineHeight: 32, flex: 1 },
	label: { fontFamily: serif, fontSize: 18, lineHeight: 24 },
	support: { fontFamily: serif, fontSize: 15, lineHeight: 22 },
	quote: {
		fontFamily: serif,
		fontSize: 18,
		lineHeight: 26,
		fontStyle: 'italic',
	},
	citation: {
		fontFamily: serif,
		fontSize: 12,
		lineHeight: 18,
		letterSpacing: 3,
	},
} as const;
