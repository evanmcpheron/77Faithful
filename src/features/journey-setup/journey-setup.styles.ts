import { Spacing } from '@td/theme/spacing';
import styled from 'styled-components/native';

export const SetupColumn = styled.View({ gap: Spacing.Medium });
export const SetupRow = styled.View({
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: Spacing.Small,
});
export const SetupContainer = styled.View({
	width: '100%',
	maxWidth: 640,
	alignSelf: 'center',
	padding: Spacing.Large,
});
