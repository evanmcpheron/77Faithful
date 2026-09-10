import { createContext } from 'react';

import type { IAuthProviderValue } from './auth.types';

export const AuthContext = createContext<IAuthProviderValue | null>(null);
