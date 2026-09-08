import { ActionControl, type ActionControlProps } from './ui/action-control';

export type TextLinkProps = ActionControlProps & { children: string };

export function TextLink({ children, ...props }: TextLinkProps) {
  return <ActionControl accessibilityRole="link" {...props} appearance="link" label={children} />;
}
