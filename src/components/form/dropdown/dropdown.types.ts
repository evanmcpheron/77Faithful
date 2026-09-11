import type { ISelectOption } from '@turndown/library';

export interface IDropdownProps<T extends string = string> {
	name?: string;
	label: string;
	options: ISelectOption[];
	multiSelect?: boolean;
	placeholder?: string;
	value?: T | T[];
	defaultValue?: T | T[];
	disabled?: boolean;
	ignoreForm?: boolean;
	maxVisibleOptions?: number;
	testID?: string;
	onChange?: (value: T | T[]) => void;
	onSelect?: (option: ISelectOption) => void;
}
