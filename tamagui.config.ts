import { defaultConfig } from '@tamagui/config/v5';
import { createTamagui } from 'tamagui';

export const tamaguiConfig = createTamagui(defaultConfig);

type TAppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends TAppTamaguiConfig {}
}

export default tamaguiConfig;
