import AppleIcon from '@td/assets/icons/brands/apple.svg';
import FacebookIcon from '@td/assets/icons/brands/facebook.svg';
import GoogleIcon from '@td/assets/icons/brands/google.svg';
import DarkLogoWordIcon from '@td/assets/images/brand/dark-logo-word.svg';
import DarkLogoIcon from '@td/assets/images/brand/dark-logo.svg';
import LightLogoWordIcon from '@td/assets/images/brand/light-logo-word.svg';
import LightLogoIcon from '@td/assets/images/brand/light-logo.svg';

import type { TIconComponent } from './icon-variant-map.types';

export const staticIconMap = {
	Apple: AppleIcon,
	Facebook: FacebookIcon,
	Google: GoogleIcon,
	DarkLogo: DarkLogoIcon,
	DarkLogoWord: DarkLogoWordIcon,
	LightLogo: LightLogoIcon,
	LightLogoWord: LightLogoWordIcon,
} as const satisfies Record<string, TIconComponent>;
