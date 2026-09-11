import type { Analytics } from 'firebase/analytics';
import { app } from './firebase.instance';

export const initializeAnalytics = async (): Promise<Analytics | null> => {
	if (typeof window === 'undefined') {
		return null;
	}

	const { getAnalytics, isSupported } = await import('firebase/analytics');

	if (!(await isSupported())) {
		return null;
	}

	return getAnalytics(app);
};
