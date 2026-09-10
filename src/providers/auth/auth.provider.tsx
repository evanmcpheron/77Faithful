import {
	authActions,
	subscribeToAccount,
} from '@td/services/firebase/firebase-auth.service';
import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext } from './auth.context';
import type { IAuthContextValue } from './auth.types';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [account, setAccount] =
		useState<IAuthenticatedAccountIdentity | null>(null);
	const [isInitializing, setIsInitializing] = useState(true);
	const [initializationError, setInitializationError] =
		useState<Error | null>(null);

	useEffect(
		() =>
			subscribeToAccount(
				(nextAccount) => {
					setAccount(nextAccount);
					setInitializationError(null);
					setIsInitializing(false);
				},
				(error) => {
					setAccount(null);
					setInitializationError(error);
					setIsInitializing(false);
				},
			),
		[],
	);

	const value = useMemo<IAuthContextValue>(
		() => ({
			...authActions,
			account,
			isInitializing,
			initializationError,
		}),
		[account, isInitializing, initializationError],
	);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};
