import { createContext } from 'react';

import type { IHeaderScrollContextValue } from './header-scroll.types';

export const HeaderScrollContext =
	createContext<IHeaderScrollContextValue | null>(null);
