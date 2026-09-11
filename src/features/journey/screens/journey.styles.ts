import { Layout } from '@td/theme/layout';
import type { ViewStyle } from 'react-native';
import styled from 'styled-components/native';

import { Spacing } from '@td/theme/spacing';

export const StyledJourneyContent = styled.View({
	gap: Spacing.Medium,
});

export const StyledJourneySection = styled.View({
	gap: Spacing.XSmall,
});

export const JOURNEY_PHOTO_HEIGHT = Layout.AuthHeaderHeight * 1.5;
const BODY_OVERLAP = Math.round((Spacing.Large + JOURNEY_PHOTO_HEIGHT / 3) / 2);

export const journeyStyles = {
	viewport: { flex: 1 },
	title: { width: '100%' },
	header: {
		minHeight: JOURNEY_PHOTO_HEIGHT - BODY_OVERLAP + Spacing.Large,
		overflow: 'visible',
	},
	content: { flexGrow: 1 },
	photo: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: JOURNEY_PHOTO_HEIGHT,
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
	headerDetails: {
		width: '100%',
		marginTop: 'auto',
		paddingTop: Spacing.Medium,
	},
	body: {
		marginHorizontal: Spacing.Small,
		paddingBottom: Spacing.XXLarge,
	},
} satisfies Record<string, ViewStyle>;
