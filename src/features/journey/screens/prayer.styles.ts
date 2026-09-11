import { BrandColors, SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { hexToRgbaString } from '@td/utils/styles/styles.util';
import { Image } from 'expo-image';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

export const PrayerColumn = styled(View)({
	width: '100%',
	maxWidth: 640,
	alignSelf: 'center',
	gap: Spacing.Medium,
});
export const PrayerBanner = styled(Image)({
	width: '100%',
	aspectRatio: 2.35,
	borderRadius: Radius.Medium,
});
export const PrayerIntro = styled(View)({
	alignItems: 'center',
	gap: Spacing.Small,
});
export const PromptList = styled(View)({ gap: Spacing.XSmall });
export const PromptText = styled(View)({ flex: 1, gap: Spacing.XXSmall });
export const IconCircle = styled(View)({
	width: Spacing.XLarge,
	height: Spacing.XLarge,
	borderRadius: Radius.Full,
	backgroundColor: SurfaceColors.Accent,
	alignItems: 'center',
	justifyContent: 'center',
});
export const ModalRoot = styled(SafeAreaView)({
	flex: 1,
	justifyContent: 'center',
	alignItems: 'center',
	padding: Spacing.Medium,
});
export const ModalBackdrop = styled(Pressable)({
	position: 'absolute',
	top: 0,
	bottom: 0,
	left: 0,
	right: 0,
	backgroundColor: hexToRgbaString(BrandColors.Primary, 0.45),
});
export const ModalCard = styled(View)({
	width: '100%',
	maxWidth: 520,
	maxHeight: '90%',
	backgroundColor: SurfaceColors.Card,
	borderRadius: Radius.Large,
	padding: Spacing.Medium,
	gap: Spacing.Small,
});
export const ModalHeader = styled(View)({
	flexDirection: 'row',
	alignItems: 'center',
	gap: Spacing.Small,
});
export const ModalBody = styled(ScrollView)({ flexGrow: 0, flexShrink: 1 });
const fontFamily = Platform.select({
	ios: 'Georgia',
	android: 'serif',
	default: 'Georgia, serif',
});
export const prayerTitleStyle = { fontFamily, fontSize: 34, lineHeight: 40 };
export const prayerBodyStyle = { fontFamily, fontSize: 20, lineHeight: 28 };
export const promptTitleStyle = { fontFamily, fontSize: 20, lineHeight: 26 };
