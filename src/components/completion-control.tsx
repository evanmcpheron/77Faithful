import { SelectionControl, type SelectionControlProps } from './ui/selection-control';

export type CompletionControlProps = SelectionControlProps & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  pending?: 'local' | 'sync';
};

export function CompletionControl({ checked, onCheckedChange, ...props }: CompletionControlProps) {
  return (
    <SelectionControl
      {...props}
      kind="completion"
      checked={checked}
      onActivate={() => onCheckedChange(!checked)}
    />
  );
}
