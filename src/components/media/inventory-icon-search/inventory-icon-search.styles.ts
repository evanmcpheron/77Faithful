import { Pressable, ScrollView, View, type PressableProps } from 'react-native';
import styled from 'styled-components/native';

import {
	BorderColors,
	BrandColors,
	NeutralColors,
	SurfaceColors,
} from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';
import { TypographyStyles } from '@td/theme/typography';
import { withFilteredProps } from '@td/utils/styles/styles.util';

interface IInventoryIconOptionButtonStyleProps {
	selected: boolean;
}

const InventoryIconPreviewSize = 56;
const InventoryIconLabelHeight = TypographyStyles.Body2.LineHeight * 2;
const InventoryIconCategoryHeight = TypographyStyles.Body2.LineHeight;
const InventoryIconOptionButtonMinHeight =
	Spacing.XSmall * 2 +
	InventoryIconPreviewSize +
	Spacing.XXSmall * 2 +
	InventoryIconLabelHeight +
	InventoryIconCategoryHeight;

const FilteredPressable = withFilteredProps<
	PressableProps,
	IInventoryIconOptionButtonStyleProps
>(Pressable, ['selected']);

export const StyledInventoryIconSearch = styled(View)({
	gap: Spacing.Small,
});

export const StyledInventoryIconSearchControls = styled(View)({
	alignItems: 'flex-end',
	flexDirection: 'row',
	gap: Spacing.XSmall,
});

export const StyledInventoryIconSearchInput = styled(View)({
	flex: 1,
});

export const StyledInventoryIconTypeFilters = styled(View)({
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: Spacing.XSmall,
});

export const StyledInventoryIconMeta = styled(View)({
	gap: Spacing.XXSmall,
});

export const StyledInventoryIconResults = styled(ScrollView)({
	maxHeight: 420,
});

export const StyledInventoryIconGrid = styled(View)({
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: Spacing.XSmall,
	paddingBottom: Spacing.Small,
});

export const StyledInventoryIconOptionButton = styled(
	FilteredPressable,
)<IInventoryIconOptionButtonStyleProps>(({ selected }) => ({
	alignItems: 'center',
	backgroundColor: selected ? SurfaceColors.Accent : NeutralColors.White,
	borderColor: selected ? BrandColors.Primary : BorderColors.Subtle,
	borderRadius: Radius.Medium,
	borderWidth: 1,
	flexBasis: '31%',
	flexGrow: 1,
	flexShrink: 1,
	gap: Spacing.XXSmall,
	justifyContent: 'flex-start',
	maxWidth: '31.8%',
	minHeight: InventoryIconOptionButtonMinHeight,
	minWidth: 0,
	padding: Spacing.XSmall,
}));

export const StyledInventoryIconPreview = styled(View)({
	alignItems: 'center',
	backgroundColor: NeutralColors.Grey100,
	borderRadius: Radius.Full,
	height: InventoryIconPreviewSize,
	justifyContent: 'center',
	width: InventoryIconPreviewSize,
});

export const StyledInventoryIconLabelSlot = styled(View)({
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: InventoryIconLabelHeight,
	width: '100%',
});

export const StyledInventoryIconCategorySlot = styled(View)({
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: InventoryIconCategoryHeight,
	width: '100%',
});

export const StyledInventoryIconEmptyState = styled(View)({
	alignItems: 'center',
	backgroundColor: NeutralColors.Grey100,
	borderColor: BorderColors.Subtle,
	borderRadius: Radius.Medium,
	borderWidth: 1,
	gap: Spacing.XSmall,
	padding: Spacing.Medium,
});
