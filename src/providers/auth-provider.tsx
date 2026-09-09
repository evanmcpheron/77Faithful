import {
  applyActionCode,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User, UserCredential } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { auth } from '@77/lib/firebase';

interface IAuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  confirmEmail: (actionCode: string) => Promise<void>;
  resendEmailConfirmation: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

interface IAuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<IAuthContextValue | undefined>(undefined);

const signIn = async (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email.trim(), password);
};

const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

const signUp = async (email: string, password: string): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email.trim(), password);
};

const confirmEmail = async (actionCode: string): Promise<void> => {
  await applyActionCode(auth, actionCode);
};

const resendEmailConfirmation = async (): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('Sign in before requesting another confirmation email.');
  }

  await sendEmailVerification(auth.currentUser);
};

const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

export const AuthProvider = ({ children }: IAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setIsLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        signUp,
        confirmEmail,
        resendEmailConfirmation,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): IAuthContextValue => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return authContext;
};
