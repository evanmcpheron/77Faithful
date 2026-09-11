import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: 'AIzaSyAzRL5Zv5W9AqbFkU5RZRLk98HguJrb0CA',
	authDomain: 'faithful-4325a.firebaseapp.com',
	databaseURL: 'https://faithful-4325a-default-rtdb.firebaseio.com',
	projectId: 'faithful-4325a',
	storageBucket: 'faithful-4325a.firebasestorage.app',
	messagingSenderId: '473494098327',
	appId: '1:473494098327:web:de31d43a42932046f634d2',
	measurementId: 'G-JQD6B7BMBH',
};

// Reuse the default app during Expo Fast Refresh.
export const app = getApps().some(({ name }) => name === '[DEFAULT]')
	? getApp()
	: initializeApp(firebaseConfig);

export const db = getFirestore(app);
