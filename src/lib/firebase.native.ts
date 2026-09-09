import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// Metro resolves Firebase's React Native entry point, which exports this helper,
// but the package's platform-agnostic TypeScript declaration omits it.
// @ts-expect-error See https://firebase.google.com/docs/reference/js/auth#getreactnativepersistencestorage
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { firebaseConfig } from './firebase-config';

const isFirebaseInitialized = getApps().length > 0;

export const app = isFirebaseInitialized ? getApp() : initializeApp(firebaseConfig);
export const auth = isFirebaseInitialized
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
export const db = getFirestore(app);
