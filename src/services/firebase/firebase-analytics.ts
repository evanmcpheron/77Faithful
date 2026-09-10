import type { Analytics } from 'firebase/analytics';

// The Firebase JavaScript Analytics SDK is browser-only.
export const initializeAnalytics = async (): Promise<Analytics | null> => null;
