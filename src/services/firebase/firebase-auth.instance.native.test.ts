import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';

// Keep the error constructor shared when re-evaluating the native module.
jest.mock('firebase/app', () => jest.requireActual('firebase/app'));

jest.mock('@react-native-async-storage/async-storage', () => ({
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
}));
jest.mock('./firebase.instance', () => ({ app: { name: '[DEFAULT]' } }));
jest.mock('firebase/auth', () => ({
	initializeAuth: jest.fn(),
	getAuth: jest.fn(),
	getReactNativePersistence: (storage: unknown) => ({ storage }),
}));

beforeEach(() => jest.resetAllMocks());

it('initializes native auth with the existing AsyncStorage dependency', () => {
	jest.isolateModules(() =>
		jest.requireActual('./firebase-auth.instance.native'),
	);
	expect(initializeAuth).toHaveBeenCalledWith(
		{ name: '[DEFAULT]' },
		{ persistence: { storage: AsyncStorage } },
	);
});

it('reuses auth after Fast Refresh', () => {
	jest.mocked(initializeAuth).mockImplementation(() => {
		throw new FirebaseError(
			'auth/already-initialized',
			'Already initialized',
		);
	});
	jest.isolateModules(() =>
		jest.requireActual('./firebase-auth.instance.native'),
	);
	expect(getAuth).toHaveBeenCalledWith({ name: '[DEFAULT]' });
});

it('does not hide other initialization failures', () => {
	const error = new Error('Persistence unavailable');
	jest.mocked(initializeAuth).mockImplementation(() => {
		throw error;
	});
	expect(() =>
		jest.isolateModules(() =>
			jest.requireActual('./firebase-auth.instance.native'),
		),
	).toThrow(error);
	expect(getAuth).not.toHaveBeenCalled();
});
