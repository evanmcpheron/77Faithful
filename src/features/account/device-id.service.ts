import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc } from 'firebase/firestore';

import { db } from '@77/lib/firebase';

let deviceIdPromise: Promise<string> | null = null;

export const getDeviceId = (): Promise<string> => {
  if (deviceIdPromise) return deviceIdPromise;

  deviceIdPromise = (async () => {
    const storedDeviceId = await AsyncStorage.getItem('77faithful.deviceId');
    if (storedDeviceId) return storedDeviceId;

    const deviceId = doc(collection(db, 'deviceIds')).id;
    await AsyncStorage.setItem('77faithful.deviceId', deviceId);
    return deviceId;
  })().catch((error: unknown) => {
    deviceIdPromise = null;
    throw error;
  });

  return deviceIdPromise;
};
