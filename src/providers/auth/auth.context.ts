import { createContext } from 'react';
import type { IAuthContextValue } from './auth.types';

export const AuthContext = createContext<IAuthContextValue | null>(null);
