import { SurfaceColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import styled from 'styled-components/native';
import { scriptureTitleStyle } from './scripture.styles';

export const DisciplineSections = styled.View({ gap: Spacing.Large });
export const DisciplineHeading = styled.View({ gap: Spacing.XSmall });
export const DisciplineExamples = styled.View({ gap: Spacing.Large });
export const DisciplineRow = styled.View({
	flexDirection: 'row',
	alignItems: 'center',
	gap: Spacing.Small,
});
export const DisciplineCopy = styled.View({ flex: 1, gap: Spacing.XSmall });
export const DisciplineIconCircle = styled.View({
	width: Spacing.XXLarge + Spacing.XSmall,
	height: Spacing.XXLarge + Spacing.XSmall,
	borderRadius: Radius.Full,
	backgroundColor: SurfaceColors.Accent,
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
});
export const DisciplineDecoration = styled.View({ flexShrink: 0 });
export const DisciplineAction = styled.View({ paddingTop: Spacing.Small });
export const disciplineTitleStyle = {
	...scriptureTitleStyle,
	fontSize: 30,
	lineHeight: 38,
};
export const disciplineSectionStyle = { fontSize: 20, lineHeight: 28 };
export const disciplineNoticeStyle = { alignItems: 'flex-start' as const };
