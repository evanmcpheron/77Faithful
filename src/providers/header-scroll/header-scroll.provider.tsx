import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';

import { useSharedValue } from 'react-native-reanimated';

import { HeaderScrollContext } from './header-scroll.context';

interface IHeaderScrollProviderProps {
	children: ReactNode;
}

export const HeaderScrollProvider = ({
	children,
}: IHeaderScrollProviderProps) => {
	const scrollOffset = useSharedValue(0);

	const resetScrollOffset = useCallback(() => {
		scrollOffset.set(0);
	}, [scrollOffset]);

	const value = useMemo(
		() => ({ scrollOffset, resetScrollOffset }),
		[scrollOffset, resetScrollOffset],
	);

	return (
		<HeaderScrollContext.Provider value={value}>
			{children}
		</HeaderScrollContext.Provider>
	);
};
