import { ensureAccountProfile } from '@td/features/account/account-profile.service';
import {
	authActions,
	subscribeToAccount,
} from '@td/services/firebase/firebase-auth.service';
import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import { AuthContext } from './auth.context';
import type { IAuthContextValue, ISignUpCredentials } from './auth.types';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [account, setAccount] =
		useState<IAuthenticatedAccountIdentity | null>(null);
	const [isInitializing, setIsInitializing] = useState(true);
	const [initializationError, setInitializationError] =
		useState<Error | null>(null);
	const registration = useRef<Pick<
		ISignUpCredentials,
		'email' | 'preferredName'
	> | null>(null);
	const [profileAttempt, setProfileAttempt] = useState(0);
	const [profileState, setProfileState] = useState<{
		userId: string;
		isReady: boolean;
		error: Error | null;
	} | null>(null);

	const signUp = useCallback(async (credentials: ISignUpCredentials) => {
		// Reserve the name before Firebase publishes the signed-in account.
		// Never retain the password while profile creation is pending.
		registration.current = {
			email: credentials.email.trim().toLowerCase(),
			preferredName: credentials.preferredName ?? '',
		};
		try {
			return await authActions.signUp(credentials);
		} catch (error) {
			registration.current = null;
			throw error;
		}
	}, []);

	useEffect(
		() =>
			subscribeToAccount(
				(nextAccount) => {
					if (!nextAccount) {
						setProfileState(null);
						registration.current = null;
					}
					setAccount(nextAccount);
					setInitializationError(null);
					setIsInitializing(false);
				},
				(error) => {
					setProfileState(null);
					registration.current = null;
					setAccount(null);
					setInitializationError(error);
					setIsInitializing(false);
				},
			),
		[],
	);

	const userId = account?.userId;
	const contactEmail = account?.contactEmail;
	useEffect(() => {
		if (!userId) return;
		let isCurrent = true;
		const preferredName =
			registration.current &&
			registration.current.email === contactEmail?.toLowerCase()
				? registration.current.preferredName
				: undefined;
		void ensureAccountProfile(userId, preferredName).then(
			() => {
				if (!isCurrent) return;
				registration.current = null;
				setProfileState({ userId, isReady: true, error: null });
			},
			(cause: unknown) => {
				if (!isCurrent) return;
				setProfileState({
					userId,
					isReady: false,
					error:
						cause instanceof Error
							? cause
							: new Error('Unable to save your profile.'),
				});
			},
		);
		return () => {
			isCurrent = false;
		};
	}, [userId, contactEmail, profileAttempt]);

	const retryAccountProfile = useCallback(() => {
		setProfileState(null);
		setProfileAttempt((attempt) => attempt + 1);
	}, []);
	const isProfileReady = Boolean(
		userId && profileState?.userId === userId && profileState.isReady,
	);
	const profileError =
		profileState?.userId === userId ? (profileState?.error ?? null) : null;

	const value = useMemo<IAuthContextValue>(
		() => ({
			...authActions,
			signUp,
			account,
			isInitializing,
			initializationError,
			isProfileReady,
			profileError,
			retryAccountProfile,
		}),
		[
			account,
			isInitializing,
			initializationError,
			signUp,
			isProfileReady,
			profileError,
			retryAccountProfile,
		],
	);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};
