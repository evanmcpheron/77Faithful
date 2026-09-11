import type { IAuthenticatedAccountIdentity } from '@td/types/account/user.types';

export interface IEmailPasswordCredentials {
	readonly email: string;
	readonly password: string;
}

export interface ISignUpCredentials extends IEmailPasswordCredentials {
	readonly preferredName?: string;
}

export interface IAuthActions {
	/** Creates and signs in the account. Send verification separately so delivery can be retried. */
	signUp: (
		credentials: ISignUpCredentials,
	) => Promise<IAuthenticatedAccountIdentity>;
	signIn: (
		credentials: IEmailPasswordCredentials,
	) => Promise<IAuthenticatedAccountIdentity>;
	signOut: () => Promise<void>;
	sendEmailVerification: () => Promise<void>;
	confirmEmailVerification: (code: string) => Promise<void>;
	refreshAccount: () => Promise<IAuthenticatedAccountIdentity | null>;
	sendPasswordResetEmail: (email: string) => Promise<void>;
	verifyPasswordResetCode: (code: string) => Promise<string>;
	confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;
	reauthenticate: (password: string) => Promise<void>;
	changePassword: (newPassword: string) => Promise<void>;
	/** Sends a confirmation link before changing the contact email. Requires recent sign-in. */
	requestEmailChange: (newEmail: string) => Promise<void>;
	getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

export interface IAuthContextValue extends IAuthActions {
	readonly account: IAuthenticatedAccountIdentity | null;
	/** True until Firebase has restored the persisted session. */
	readonly isInitializing: boolean;
	readonly initializationError: Error | null;
	readonly isProfileReady: boolean;
	readonly profileError: Error | null;
	retryAccountProfile: () => void;
}
