export interface ICheckboxProps {
	name?: string;
	label?: string;
	checked?: boolean;
	defaultValue?: boolean;
	disabled?: boolean;
	ignoreForm?: boolean;
	onChange?: (checked: boolean) => void;
}
