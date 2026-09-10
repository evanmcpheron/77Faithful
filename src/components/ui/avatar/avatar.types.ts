export const AvatarVariant = {
	Default: 'Default',
	Muted: 'Muted',
	Brand: 'Brand',
} as const;

export type TAvatarVariant = (typeof AvatarVariant)[keyof typeof AvatarVariant];

export const AvatarSize = {
	Small: 'Small',
	Medium: 'Medium',
	Large: 'Large',
} as const;

export type TAvatarSize = (typeof AvatarSize)[keyof typeof AvatarSize];

export interface IAvatarProps {
	imageUrl?: string;
	initials?: string;
	accessibilityLabel?: string;
	size?: TAvatarSize;
	variant?: TAvatarVariant;
	testID?: string;
}
