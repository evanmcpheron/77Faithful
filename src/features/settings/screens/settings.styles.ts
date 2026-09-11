import type { ViewStyle } from 'react-native';

import { Layout } from '@td/theme/layout';
import { Spacing } from '@td/theme/spacing';

export const SETTINGS_PHOTO_HEIGHT = Layout.AuthHeaderHeight * 1.5;
const BODY_OVERLAP = Math.round(
	(Spacing.Large + SETTINGS_PHOTO_HEIGHT / 3) / 2,
);

export const styles = {
	viewport: { flex: 1 },
	header: {
		minHeight: SETTINGS_PHOTO_HEIGHT - BODY_OVERLAP + Spacing.Large,
		overflow: 'visible',
	},
	headerContainer: { flexGrow: 1 },
	photo: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: SETTINGS_PHOTO_HEIGHT,
		overflow: 'hidden',
	},
	photoFade: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: Spacing.XXLarge,
	},
	headerContent: {
		justifyContent: 'flex-start',
		paddingHorizontal: Spacing.Small,
		paddingTop: Spacing.XSmall,
		paddingBottom: Spacing.Large + Spacing.XSmall,
	},
	heading: { width: '100%', gap: Spacing.XSmall },
	body: {
		marginHorizontal: Spacing.Small,
		paddingBottom: Spacing.XXLarge,
	},
	content: { gap: Spacing.Medium },
	section: { gap: Spacing.XSmall },
} satisfies Record<string, ViewStyle>;
