import { SelectionControl, type SelectionControlProps } from './ui/selection-control';

export type RadioRowProps = SelectionControlProps & {
  selected: boolean;
  onSelect: () => void;
  groupName: string;
};

export function RadioRow({ selected, onSelect, ...props }: RadioRowProps) {
  return (
    <SelectionControl
      {...props}
      kind="radio"
      checked={selected}
      onActivate={() => {
        if (!selected) onSelect();
      }}
    />
  );
}
