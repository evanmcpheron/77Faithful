import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-expect-error Firebase exports this from its native entry point, but omits it from the shared declarations.
import { getReactNativePersistence } from 'firebase/auth';
import { app } from './firebase.instance';

const initializeNativeAuth = () => {
	try {
		return initializeAuth(app, {
			persistence: getReactNativePersistence(AsyncStorage),
		});
	} catch (error) {
		// Fast Refresh must reuse the already initialized, persistent instance.
		if (
			error instanceof FirebaseError &&
			error.code === 'auth/already-initialized'
		) {
			return getAuth(app);
		}
		throw error;
	}
};

export const auth = initializeNativeAuth();
