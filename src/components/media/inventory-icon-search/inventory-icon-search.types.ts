import type {
	IInventoryIconOption,
	TIconName,
	TIconVariant,
} from '@td/components/ui/icon/icon.types';

export interface IInventoryIconSearchProps {
	selectedIconName?: TIconName;
	defaultVariant?: TIconVariant;
	testID?: string;
	onSelect?: (
		iconOption: IInventoryIconOption,
		iconVariant: TIconVariant,
	) => void;
	onSave?: (
		iconOption: IInventoryIconOption,
		iconVariant: TIconVariant,
	) => void;
	onCancel?: () => void;
}
