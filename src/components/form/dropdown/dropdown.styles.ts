import type { ComponentProps } from 'react';
import { Pressable, PressableProps, ScrollView, View } from 'react-native';
import styled from 'styled-components/native';

import {
	BorderColors,
	BrandColors,
	NeutralColors,
	SurfaceColors,
} from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Shadows } from '@td/theme/shadows';
import { Spacing } from '@td/theme/spacing';
import { withFilteredProps } from '@td/utils/styles/styles.util';

interface IDropdownTriggerStyleProps {
	isOpen: boolean;
}

interface IDropdownSingleOptionRowStyleProps {
	isSelected: boolean;
}

const FilteredView = withFilteredProps<ComponentProps<typeof View>, object>(
	View,
	[],
);

const FilteredDropdownTriggerPressable = withFilteredProps<
	PressableProps,
	IDropdownTriggerStyleProps
>(Pressable, ['isOpen']);

const FilteredDropdownSingleOptionPressable = withFilteredProps<
	PressableProps,
	IDropdownSingleOptionRowStyleProps
>(Pressable, ['isSelected']);

const FilteredScrollView = withFilteredProps<
	ComponentProps<typeof ScrollView>,
	object
>(ScrollView, []);

export const StyledDropdownFieldContainer = styled(FilteredView)({
	flex: 1,
	flexDirection: 'column',
	gap: Spacing.XSmall,
});

export const StyledDropdownTrigger = styled(
	FilteredDropdownTriggerPressable,
)<IDropdownTriggerStyleProps>(({ disabled, isOpen }) => ({
	...Shadows.Card,
	alignItems: 'center',
	backgroundColor: NeutralColors.White,
	borderColor: isOpen ? BrandColors.Primary : BorderColors.Default,
	borderRadius: Radius.Medium,
	borderWidth: isOpen ? 2 : 1,
	flexDirection: 'row',
	gap: Spacing.XSmall,
	justifyContent: 'space-between',
	minHeight: 50,
	opacity: disabled ? 0.5 : 1,
	paddingHorizontal: isOpen ? 15 : 16,
	paddingVertical: 8,
}));

export const StyledDropdownValueContainer = styled(FilteredView)({
	flex: 1,
	justifyContent: 'center',
	minHeight: 32,
});

export const StyledDropdownTagsContainer = styled(FilteredView)({
	alignItems: 'center',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: Spacing.XSmall,
});

export const StyledDropdownTag = styled(FilteredView)({
	alignItems: 'center',
	backgroundColor: SurfaceColors.Muted,
	borderRadius: Radius.Full,
	flexDirection: 'row',
	gap: Spacing.XSmall,
	paddingBottom: 8,
	paddingLeft: 12,
	paddingRight: 8,
	paddingTop: 8,
});

export const StyledDropdownTagRemoveButton = styled(Pressable)({});

export const StyledDropdownModalRoot = styled(FilteredView)({
	flex: 1,
});

export const StyledDropdownBackdrop = styled(Pressable)({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const StyledDropdownMenu = styled(FilteredView)({
	...Shadows.Subtle,
	backgroundColor: NeutralColors.White,
	borderColor: BorderColors.Subtle,
	borderRadius: Radius.Large,
	borderWidth: 1,
	paddingVertical: Spacing.XSmall,
	position: 'absolute',
});

export const StyledDropdownMenuScrollView = styled(FilteredScrollView)({
	flexGrow: 0,
});

export const StyledDropdownCheckboxOptionRow = styled(FilteredView)({
	paddingHorizontal: Spacing.Small,
	paddingVertical: 4,
});

export const StyledDropdownSingleOptionRow = styled(
	FilteredDropdownSingleOptionPressable,
)<IDropdownSingleOptionRowStyleProps>(({ isSelected }) => ({
	backgroundColor: isSelected ? SurfaceColors.Muted : 'transparent',
	borderRadius: Radius.Medium,
	justifyContent: 'center',
	minHeight: Spacing.XXLarge,
	paddingHorizontal: Spacing.Small,
	marginHorizontal: Spacing.XSmall,
	paddingVertical: 8,
}));

export const StyledDropdownEmptyState = styled(FilteredView)({
	paddingHorizontal: Spacing.Small,
	paddingVertical: Spacing.XSmall,
});
