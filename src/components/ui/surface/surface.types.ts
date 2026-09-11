import type { ReactNode } from 'react';

export const SurfaceVariant = {
	Default: 'Default',
	Muted: 'Muted',
	Brand: 'Brand',
} as const;

export type TSurfaceVariant =
	(typeof SurfaceVariant)[keyof typeof SurfaceVariant];

export const SurfacePadding = {
	None: 'None',
	Small: 'Small',
	Medium: 'Medium',
} as const;

export type TSurfacePadding =
	(typeof SurfacePadding)[keyof typeof SurfacePadding];

export interface ISurfaceProps {
	children: ReactNode;
	variant?: TSurfaceVariant;
	padding?: TSurfacePadding;
	testID?: string;
}
