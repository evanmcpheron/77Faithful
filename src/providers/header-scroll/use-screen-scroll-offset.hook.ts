import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { useHeaderScroll } from './header-scroll.hook';

export const useScreenScrollOffset = () => {
	const { scrollOffset } = useHeaderScroll();
	const lastKnownScrollY = useRef(0);

	const handleScrollPositionChange = useCallback((y: number) => {
		lastKnownScrollY.current = y;
	}, []);

	useFocusEffect(
		useCallback(() => {
			scrollOffset.set(lastKnownScrollY.current);
		}, [scrollOffset]),
	);

	return { scrollOffset, handleScrollPositionChange };
};
