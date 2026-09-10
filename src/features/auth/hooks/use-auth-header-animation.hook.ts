import {
	interpolate,
	useAnimatedStyle,
	type SharedValue,
} from 'react-native-reanimated';

export const useAuthHeaderAnimation = (
	scrollOffset: SharedValue<number>,
	headerHeight: number,
) =>
	useAnimatedStyle(() => ({
		transform: [
			{
				translateY: interpolate(
					scrollOffset.value,
					[-headerHeight, 0, headerHeight],
					[-headerHeight / 2, 0, headerHeight * 0.75],
				),
			},
			{
				scale: interpolate(
					scrollOffset.value,
					[-headerHeight, 0, headerHeight],
					[2, 1, 1],
				),
			},
		],
	}));
