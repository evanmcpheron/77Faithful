import type { DimensionValue } from 'react-native';

export const SkeletonVariant = {
	Text: 'Text',
	Block: 'Block',
	Circle: 'Circle',
} as const;

export type TSkeletonVariant =
	(typeof SkeletonVariant)[keyof typeof SkeletonVariant];

export interface ISkeletonProps {
	variant?: TSkeletonVariant;
	width?: DimensionValue;
	height?: number;
	testID?: string;
}
