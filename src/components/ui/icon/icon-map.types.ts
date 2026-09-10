import { iconAliasMap } from './icon-alias-map.types';
import { iconNameVariantMap } from './icon-name-variant-map.types';
import { staticIconMap } from './icon-static-map.types';
import type { TIconComponent } from './icon-variant-map.types';
import { iconVariantMap } from './icon-variant-map.types';
import type { TIconVariant } from './icon-variant.types';

export const iconMap = {
	...staticIconMap,
	...iconAliasMap,
} as const satisfies Record<string, TIconComponent>;

export type TIconName = keyof typeof iconMap;

const brandIconColorMap: Partial<Record<TIconName, string>> = {
	Apple: '#000000',
	Facebook: '#1877F2',
};

export const getBrandIconColor = (name: TIconName): string | undefined => {
	return brandIconColorMap[name];
};

export const IconName = Object.fromEntries(
	(Object.keys(iconMap) as TIconName[]).map((key) => [key, key]),
) as { readonly [K in TIconName]: K };

export const getIconComponent = (
	name: TIconName,
	variant?: TIconVariant,
): TIconComponent => {
	const iconVariantConfiguration =
		iconNameVariantMap[name as keyof typeof iconNameVariantMap];

	if (!iconVariantConfiguration) {
		return iconMap[name];
	}

	return iconVariantMap[iconVariantConfiguration.iconVariantName][
		variant ?? iconVariantConfiguration.defaultVariant
	];
};
