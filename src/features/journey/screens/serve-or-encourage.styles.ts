import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import styled from 'styled-components/native';
import { scriptureTitleStyle } from './scripture.styles';

export const ServeContent = styled.View({ gap: Spacing.Large });
export const ServeHeading = styled.View({
	alignItems: 'center',
	gap: Spacing.XSmall,
});
export const ServeHeadingRule = styled.View({
	width: Spacing.XXHuge,
	paddingTop: Spacing.XSmall,
});
export const ServeExamples = styled.View({ gap: Spacing.Medium });
export const ServeExampleRow = styled.View({
	flexDirection: 'row',
	alignItems: 'center',
	gap: Spacing.Medium,
});
export const ServeExampleCopy = styled.View({ flex: 1 });
export const ServeIconCircle = styled.View({
	width: Spacing.XXLarge,
	height: Spacing.XXLarge,
	borderRadius: Radius.Full,
	backgroundColor: SurfaceColors.Accent,
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
});
export const serveTitleStyle = {
	...scriptureTitleStyle,
	fontSize: 34,
	lineHeight: 40,
};
export const serveBodyStyle = { fontSize: 18, lineHeight: 24 };
export const serveExampleStyle = {
	...scriptureTitleStyle,
	fontSize: 20,
	lineHeight: 26,
};
export const serveNoteStyle = { fontSize: 16, lineHeight: 24 };
