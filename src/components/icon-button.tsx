import { type AppIconName } from './app-icon';
import { ActionControl, type ActionControlProps } from './ui/action-control';

export type IconButtonProps = ActionControlProps & {
  icon: AppIconName;
  accessibilityLabel: string;
};

export function IconButton(props: IconButtonProps) {
  return <ActionControl {...props} appearance="icon" />;
}
