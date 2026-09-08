import { SelectionControl, type SelectionControlProps } from './ui/selection-control';

export type SelectionCardProps = SelectionControlProps & {
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  description: string;
};

export function SelectionCard({ selected, onSelectedChange, ...props }: SelectionCardProps) {
  return (
    <SelectionControl
      {...props}
      kind="selection"
      checked={selected}
      onActivate={() => onSelectedChange(!selected)}
    />
  );
}
