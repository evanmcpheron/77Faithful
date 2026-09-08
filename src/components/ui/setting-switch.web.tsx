import { type CSSProperties } from 'react';
import { Switch, type SwitchProps } from 'react-native';

import classes from './setting-switch.module.css';

import { BorderWidth, ControlSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SettingSwitch(props: SwitchProps) {
  const theme = useTheme();
  const style: CSSProperties & Record<`--${string}`, string> = {
    '--target-size': `${ControlSize.minTouchTarget}px`,
    '--focus-width': `${BorderWidth.focus}px`,
    '--focus-gap': `${Spacing.half}px`,
    '--focus-color': theme.focus,
    '--control-radius': `${Radius.control}px`,
  };

  return (
    <div className={classes.target} style={style} onClick={(event) => event.stopPropagation()}>
      <Switch {...props} />
    </div>
  );
}
