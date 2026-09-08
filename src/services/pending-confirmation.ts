import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthError } from '@/auth/errors';
import { emailError } from '@/auth/validation';

const storageKey = '77faithful.auth.pending-confirmation';

export async function savePendingConfirmation(email: string): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify({ version: 1, email }));
  } catch {
    throw new AuthError('storage');
  }
}

export async function clearPendingConfirmation(): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey);
  } catch {
    throw new AuthError('storage');
  }
}

export async function loadPendingConfirmation(): Promise<string | null> {
  let stored: string | null;
  try {
    stored = await AsyncStorage.getItem(storageKey);
  } catch {
    throw new AuthError('storage');
  }
  if (stored === null) return null;

  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch {
    await clearPendingConfirmation();
    return null;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    value.version === 1 &&
    'email' in value &&
    typeof value.email === 'string' &&
    !emailError(value.email) &&
    Object.keys(value).length === 2
  ) {
    return value.email;
  }
  await clearPendingConfirmation();
  return null;
}
