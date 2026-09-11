import { Platform, StyleSheet } from 'react-native';

import { BorderColors, NeutralColors, SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';

const editorialFont = Platform.select({
	ios: 'Georgia',
	android: 'serif',
	default: 'Georgia',
});

export const styles = StyleSheet.create({
	viewport: { flex: 1, backgroundColor: SurfaceColors.Screen },
	hero: {
		flexBasis: '37%',
		flexGrow: 1,
		flexShrink: 1,
		width: '100%',
		overflow: 'hidden',
		backgroundColor: SurfaceColors.Muted,
	},
	image: { ...StyleSheet.absoluteFill },
	photoOverlay: {
		...StyleSheet.absoluteFill,
		backgroundColor: NeutralColors.White,
		opacity: 0.3,
	},
	wave: {
		position: 'absolute',
		bottom: -1,
		left: 0,
		right: 0,
		height: Spacing.Large,
	},
	body: {
		width: '100%',
		maxWidth: 640,
		alignSelf: 'center',
		paddingHorizontal: Spacing.Medium,
		paddingTop: Spacing.XSmall,
		gap: Spacing.Small,
	},
	intro: { gap: Spacing.XSmall },
	eyebrow: { letterSpacing: 2.5, fontSize: 11, lineHeight: 16 },
	title: {
		fontFamily: editorialFont,
		fontSize: 30,
		lineHeight: 34,
		fontWeight: '400',
	},
	copy: { fontSize: 14, lineHeight: 20 },
	cardRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: Spacing.Small,
	},
	cardCopy: { flex: 1, gap: Spacing.XSmall },
	cardTitle: {
		fontFamily: editorialFont,
		fontSize: 23,
		lineHeight: 28,
		fontWeight: '400',
	},
	botanical: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: SurfaceColors.Accent,
		alignItems: 'center',
		justifyContent: 'center',
	},
	welcome: {
		flexDirection: 'row',
		gap: Spacing.Small,
		alignItems: 'center',
		paddingHorizontal: Spacing.XSmall,
	},
	welcomeCopy: {
		flex: 1,
		borderLeftWidth: 1,
		borderLeftColor: BorderColors.Default,
		paddingLeft: Spacing.Small,
	},
	action: { gap: Spacing.XSmall },
	browserHint: { fontSize: 12, lineHeight: 18 },
	footer: {
		flexGrow: 1,
		flexShrink: 1,
		overflow: 'hidden',
		justifyContent: 'flex-end',
	},
	footerImage: {
		width: '100%',
		// Crop the transparent strip along the supplied artwork's bottom edge.
		aspectRatio: 2170 / 695,
	},
});
