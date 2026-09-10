import { StyledSkeleton } from './skeleton.styles';
import type { ISkeletonProps } from './skeleton.types';

const getDefaultSkeletonHeight = (
	variant: NonNullable<ISkeletonProps['variant']>,
) => {
	if (variant === 'Text') {
		return 16;
	}

	if (variant === 'Circle') {
		return 40;
	}

	return 72;
};

const getDefaultSkeletonWidth = (
	variant: NonNullable<ISkeletonProps['variant']>,
) => {
	if (variant === 'Text') {
		return '100%' as const;
	}

	if (variant === 'Circle') {
		return 40;
	}

	return '100%' as const;
};

export const Skeleton = ({
	height,
	testID,
	variant = 'Block',
	width,
}: ISkeletonProps) => {
	const resolvedHeight = height ?? getDefaultSkeletonHeight(variant);
	const resolvedWidth = width ?? getDefaultSkeletonWidth(variant);

	return (
		<StyledSkeleton
			height={resolvedHeight}
			testID={testID}
			variant={variant}
			width={resolvedWidth}
		/>
	);
};
