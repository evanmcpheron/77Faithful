import { useContext } from 'react';

import { HeaderScrollContext } from './header-scroll.context';

export const useHeaderScroll = () => {
	const context = useContext(HeaderScrollContext);

	if (!context) {
		throw new Error(
			'useHeaderScroll must be used within a HeaderScrollProvider',
		);
	}

	return context;
};
