import { ActionControl, type ActionControlProps, type ButtonVariant } from './ui/action-control';

export type ButtonProps = ActionControlProps & {
  children: string;
  variant?: ButtonVariant;
};

export function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  return <ActionControl {...props} appearance={variant} label={children} />;
}
